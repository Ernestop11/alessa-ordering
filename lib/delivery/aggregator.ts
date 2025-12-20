/**
 * Delivery Aggregator - Smart Dispatch System
 *
 * Fetches quotes from multiple delivery providers in parallel,
 * compares prices/ETAs, and enables auto-selection of the best option.
 *
 * Supports:
 * - Uber Direct
 * - DoorDash Drive
 * - Self-delivery (restaurant's own drivers)
 */

import {
  getUberCredentialsForTenant,
  getUberAccessTokenForTenant,
  getUberApiBaseUrl,
  isUberDirectConfiguredForTenant,
} from '@/lib/uber/auth';
import { getDoorDashAuthToken } from '@/lib/doordash/jwt';

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface DeliveryQuote {
  provider: 'uber' | 'doordash' | 'self';
  providerName: string;
  deliveryFee: number;
  etaMinutes: number;
  quoteId: string;
  expiresAt: string;
  mode: 'live' | 'mock' | 'sandbox';
  available: boolean;
  error?: string;
}

export interface SmartQuoteResult {
  quotes: DeliveryQuote[];
  cheapest: DeliveryQuote | null;
  fastest: DeliveryQuote | null;
  enabledProviders: string[];
  timestamp: string;
}

export interface TenantWithIntegrations {
  id: string;
  name: string;
  slug: string;
  integrations: {
    uberClientId?: string | null;
    uberClientSecret?: string | null;
    uberCustomerId?: string | null;
    uberSandbox?: boolean | null;
    uberOnboardingStatus?: string | null;
    doordashOnboardingStatus?: string | null;
    deliveryBaseFee?: number | null;
    smartDispatchEnabled?: boolean | null;
    smartDispatchStrategy?: string | null;
    [key: string]: unknown;
  } | null;
  settings?: {
    selfDeliveryEnabled?: boolean;
    selfDeliveryFee?: number;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

/**
 * Determine which delivery providers are enabled for a tenant
 */
export function getEnabledDeliveryProviders(tenant: TenantWithIntegrations): {
  uber: boolean;
  doordash: boolean;
  self: boolean;
} {
  const integration = tenant.integrations;

  return {
    uber:
      integration?.uberOnboardingStatus === 'connected' ||
      isUberDirectConfiguredForTenant(integration),
    doordash:
      integration?.doordashOnboardingStatus === 'connected' ||
      getDoorDashAuthToken() !== null,
    self: tenant.settings?.selfDeliveryEnabled ?? false,
  };
}

/**
 * Fetch quote from Uber Direct API
 */
export async function fetchUberQuote(
  pickupAddress: DeliveryAddress,
  dropoffAddress: DeliveryAddress,
  tenant: TenantWithIntegrations
): Promise<DeliveryQuote> {
  const providerName = 'Uber Direct';

  try {
    // Check if configured
    if (!isUberDirectConfiguredForTenant(tenant.integrations)) {
      // Return mock quote
      const baseFee = tenant.integrations?.deliveryBaseFee ?? 6.99;
      const perMileFee = 0.75;
      const estimatedMiles = 3.5;
      const deliveryFee = parseFloat((baseFee + perMileFee * estimatedMiles).toFixed(2));

      return {
        provider: 'uber',
        providerName,
        deliveryFee,
        etaMinutes: 25,
        quoteId: `uber_mock_${Date.now()}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        mode: 'mock',
        available: true,
      };
    }

    // Get credentials and token
    const credentials = getUberCredentialsForTenant(tenant.integrations, tenant.id);
    if (!credentials) {
      return {
        provider: 'uber',
        providerName,
        deliveryFee: 0,
        etaMinutes: 0,
        quoteId: '',
        expiresAt: '',
        mode: 'live',
        available: false,
        error: 'Uber credentials not configured',
      };
    }

    const accessToken = await getUberAccessTokenForTenant(credentials);
    if (!accessToken) {
      return {
        provider: 'uber',
        providerName,
        deliveryFee: 0,
        etaMinutes: 0,
        quoteId: '',
        expiresAt: '',
        mode: 'live',
        available: false,
        error: 'Failed to authenticate with Uber',
      };
    }

    const baseUrl = getUberApiBaseUrl();
    const customerId = credentials.customerId;

    // Build request
    const uberRequest = {
      pickup_address: JSON.stringify({
        street_address: [pickupAddress.street],
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip_code: pickupAddress.zipCode,
        country: 'US',
      }),
      dropoff_address: JSON.stringify({
        street_address: [dropoffAddress.street],
        city: dropoffAddress.city,
        state: dropoffAddress.state,
        zip_code: dropoffAddress.zipCode,
        country: 'US',
      }),
    };

    const response = await fetch(
      `${baseUrl}/customers/${customerId}/delivery_quotes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uberRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Aggregator] Uber quote error:', errorText);
      return {
        provider: 'uber',
        providerName,
        deliveryFee: 0,
        etaMinutes: 0,
        quoteId: '',
        expiresAt: '',
        mode: 'live',
        available: false,
        error: `Uber API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const dropoffEta = new Date(data.dropoff_eta);
    const etaMinutes = Math.round((dropoffEta.getTime() - Date.now()) / 60000);

    return {
      provider: 'uber',
      providerName,
      deliveryFee: data.fee / 100, // Convert cents to dollars
      etaMinutes,
      quoteId: data.id,
      expiresAt: data.expires,
      mode: credentials.sandbox ? 'sandbox' : 'live',
      available: true,
    };
  } catch (error) {
    console.error('[Aggregator] Uber quote error:', error);
    return {
      provider: 'uber',
      providerName,
      deliveryFee: 0,
      etaMinutes: 0,
      quoteId: '',
      expiresAt: '',
      mode: 'live',
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch quote from DoorDash Drive API
 */
export async function fetchDoorDashQuote(
  pickupAddress: DeliveryAddress,
  dropoffAddress: DeliveryAddress,
  tenant: TenantWithIntegrations,
  orderValue?: number
): Promise<DeliveryQuote> {
  const providerName = 'DoorDash Drive';

  try {
    const authToken = getDoorDashAuthToken();
    const isSandbox = process.env.DOORDASH_SANDBOX === 'true';

    // If not configured, return mock
    if (!authToken) {
      const baseFee = tenant.integrations?.deliveryBaseFee ?? 4.99;
      const perMileFee = 1.5;
      const estimatedMiles = 3.5;
      const deliveryFee = parseFloat((baseFee + perMileFee * estimatedMiles).toFixed(2));

      return {
        provider: 'doordash',
        providerName,
        deliveryFee,
        etaMinutes: 35,
        quoteId: `dd_mock_${Date.now()}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        mode: 'mock',
        available: true,
      };
    }

    // Format address for DoorDash
    const formatAddress = (addr: DeliveryAddress) =>
      `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;

    const externalDeliveryId = `quote_${tenant.slug}_${Date.now()}`;
    const doordashRequest = {
      external_delivery_id: externalDeliveryId,
      pickup_address: formatAddress(pickupAddress),
      pickup_business_name: tenant.name,
      dropoff_address: formatAddress(dropoffAddress),
      order_value: Math.round((orderValue || 0) * 100),
    };

    const response = await fetch('https://openapi.doordash.com/drive/v2/quotes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doordashRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Aggregator] DoorDash quote error:', errorText);
      return {
        provider: 'doordash',
        providerName,
        deliveryFee: 0,
        etaMinutes: 0,
        quoteId: '',
        expiresAt: '',
        mode: isSandbox ? 'sandbox' : 'live',
        available: false,
        error: `DoorDash API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const deliveryFee = data.fee / 100;
    const etaMinutes = data.estimated_dropoff_time
      ? Math.round((new Date(data.estimated_dropoff_time).getTime() - Date.now()) / 60000)
      : 35;

    return {
      provider: 'doordash',
      providerName,
      deliveryFee,
      etaMinutes,
      quoteId: data.quote_id || data.external_delivery_id,
      expiresAt: data.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      mode: isSandbox ? 'sandbox' : 'live',
      available: true,
    };
  } catch (error) {
    console.error('[Aggregator] DoorDash quote error:', error);
    return {
      provider: 'doordash',
      providerName,
      deliveryFee: 0,
      etaMinutes: 0,
      quoteId: '',
      expiresAt: '',
      mode: 'live',
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get self-delivery quote (restaurant's own drivers)
 */
export function getSelfDeliveryQuote(tenant: TenantWithIntegrations): DeliveryQuote {
  const fee = tenant.settings?.selfDeliveryFee ?? tenant.integrations?.deliveryBaseFee ?? 5.99;

  return {
    provider: 'self',
    providerName: 'Restaurant Delivery',
    deliveryFee: fee,
    etaMinutes: 30,
    quoteId: `self_${Date.now()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    mode: 'live',
    available: true,
  };
}

/**
 * Fetch quotes from all enabled providers in parallel
 */
export async function getSmartQuotes(
  pickupAddress: DeliveryAddress,
  dropoffAddress: DeliveryAddress,
  tenant: TenantWithIntegrations,
  orderValue?: number
): Promise<SmartQuoteResult> {
  const enabledProviders = getEnabledDeliveryProviders(tenant);
  const enabledList: string[] = [];

  // Build array of quote promises
  const quotePromises: Promise<DeliveryQuote>[] = [];

  if (enabledProviders.uber) {
    enabledList.push('uber');
    quotePromises.push(fetchUberQuote(pickupAddress, dropoffAddress, tenant));
  }

  if (enabledProviders.doordash) {
    enabledList.push('doordash');
    quotePromises.push(fetchDoorDashQuote(pickupAddress, dropoffAddress, tenant, orderValue));
  }

  if (enabledProviders.self) {
    enabledList.push('self');
    quotePromises.push(Promise.resolve(getSelfDeliveryQuote(tenant)));
  }

  // Fetch all quotes in parallel
  const results = await Promise.allSettled(quotePromises);

  // Extract successful quotes
  const quotes: DeliveryQuote[] = results
    .filter((r): r is PromiseFulfilledResult<DeliveryQuote> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((q) => q.available);

  // Sort by price to find cheapest
  const sortedByPrice = [...quotes].sort((a, b) => a.deliveryFee - b.deliveryFee);

  // Sort by ETA to find fastest
  const sortedByEta = [...quotes].sort((a, b) => a.etaMinutes - b.etaMinutes);

  return {
    quotes: sortedByPrice, // Return sorted by price by default
    cheapest: sortedByPrice[0] || null,
    fastest: sortedByEta[0] || null,
    enabledProviders: enabledList,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Select best quote based on strategy
 */
export function selectBestQuote(
  quotes: DeliveryQuote[],
  strategy: 'cheapest' | 'fastest' = 'cheapest'
): DeliveryQuote | null {
  if (quotes.length === 0) return null;

  const availableQuotes = quotes.filter((q) => q.available);
  if (availableQuotes.length === 0) return null;

  if (strategy === 'fastest') {
    return availableQuotes.reduce((a, b) => (a.etaMinutes < b.etaMinutes ? a : b));
  }

  // Default: cheapest
  return availableQuotes.reduce((a, b) => (a.deliveryFee < b.deliveryFee ? a : b));
}
