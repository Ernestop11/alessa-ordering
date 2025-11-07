import type { Prisma } from '@prisma/client';

interface TaxLineItem {
  id: string;
  quantity: number;
  unitPrice: number;
  taxCode?: string | null;
}

interface TaxDestination {
  country?: string | null;
  state?: string | null;
  postalCode?: string | null;
  city?: string | null;
  line1?: string | null;
  line2?: string | null;
}

interface TenantIntegrationSnapshot {
  taxProvider?: string | null;
  taxConfig?: Prisma.JsonValue | null;
  defaultTaxRate?: number | null;
}

interface TenantSnapshot {
  id: string;
  slug: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  integrations?: TenantIntegrationSnapshot | null;
}

interface TaxCalculationInput {
  tenant: TenantSnapshot;
  items: TaxLineItem[];
  subtotal: number;
  shipping?: number;
  surcharge?: number;
  currency?: string;
  destination?: TaxDestination | null;
}

export interface TaxCalculationResult {
  amount: number;
  rate: number;
  provider: string;
  breakdown?: Record<string, unknown>;
  warnings?: string[];
  raw?: unknown;
}

interface ParsedTaxConfig {
  apiKey?: string;
  nexusAddresses?: Array<Record<string, unknown>>;
  defaultProductTaxCode?: string;
  shippingTaxable?: boolean;
  surchargeTaxable?: boolean;
  fallbackRate?: number;
}

function toNumber(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Number(value ?? 0);
}

function parseTaxConfig(value: Prisma.JsonValue | null | undefined): ParsedTaxConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : undefined,
    nexusAddresses: Array.isArray(record.nexusAddresses)
      ? (record.nexusAddresses.filter((entry) => entry && typeof entry === 'object') as Array<Record<string, unknown>>)
      : undefined,
    defaultProductTaxCode: typeof record.defaultProductTaxCode === 'string' ? record.defaultProductTaxCode : undefined,
    shippingTaxable: record.shippingTaxable === true,
    surchargeTaxable: record.surchargeTaxable !== false,
    fallbackRate:
      typeof record.fallbackRate === 'number' && Number.isFinite(record.fallbackRate) ? record.fallbackRate : undefined,
  };
}

function calculateWithDefaultRate({
  subtotal,
  shipping = 0,
  surcharge = 0,
  rate,
  config,
}: {
  subtotal: number;
  shipping?: number;
  surcharge?: number;
  rate: number;
  config: ParsedTaxConfig;
}): TaxCalculationResult {
  const taxableShipping = config.shippingTaxable ? shipping : 0;
  const taxableSurcharge = config.surchargeTaxable ? surcharge : 0;
  const taxableAmount = subtotal + taxableShipping + taxableSurcharge;
  const amount = Number((taxableAmount * rate).toFixed(2));
  return {
    amount,
    rate,
    provider: 'builtin',
    breakdown: {
      taxableAmount: Number(taxableAmount.toFixed(2)),
      shippingTaxable: Boolean(config.shippingTaxable),
      surchargeTaxable: Boolean(config.surchargeTaxable),
    },
  };
}

async function calculateWithTaxJar(
  input: TaxCalculationInput,
  config: ParsedTaxConfig,
): Promise<TaxCalculationResult> {
  const apiKey = config.apiKey ?? process.env.TAXJAR_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TaxJar API key.');
  }

  const origin: TaxDestination = {
    country: input.tenant.country ?? 'US',
    state: input.tenant.state ?? null,
    postalCode: input.tenant.postalCode ?? null,
    city: input.tenant.city ?? null,
    line1: input.tenant.addressLine1 ?? null,
    line2: input.tenant.addressLine2 ?? null,
  };

  const destination: TaxDestination = {
    country: input.destination?.country ?? origin.country ?? 'US',
    state: input.destination?.state ?? null,
    postalCode: input.destination?.postalCode ?? origin.postalCode ?? null,
    city: input.destination?.city ?? null,
    line1: input.destination?.line1 ?? null,
    line2: input.destination?.line2 ?? null,
  };

  if (!destination.postalCode) {
    throw new Error('Destination postal code is required for TaxJar calculations.');
  }

  const amount = Number(input.subtotal.toFixed(2));
  const shipping = Number((input.shipping ?? 0).toFixed(2));
  const surcharge = Number((input.surcharge ?? 0).toFixed(2));

  const lineItems = input.items.map((item, index) => ({
    id: item.id || `item-${index + 1}`,
    quantity: item.quantity,
    unit_price: Number(item.unitPrice.toFixed(2)),
    discount: 0,
    product_tax_code: item.taxCode ?? config.defaultProductTaxCode ?? undefined,
  }));

  if (surcharge > 0) {
    lineItems.push({
      id: 'surcharge',
      quantity: 1,
      unit_price: surcharge,
      discount: 0,
      product_tax_code: config.defaultProductTaxCode ?? undefined,
    });
  }

  const payload = {
    from_country: origin.country ?? 'US',
    from_zip: origin.postalCode ?? undefined,
    from_state: origin.state ?? undefined,
    from_city: origin.city ?? undefined,
    from_street: origin.line1 ?? undefined,
    to_country: destination.country ?? 'US',
    to_zip: destination.postalCode,
    to_state: destination.state ?? undefined,
    to_city: destination.city ?? undefined,
    to_street: destination.line1 ?? undefined,
    amount,
    shipping,
    nexus_addresses: config.nexusAddresses ?? undefined,
    line_items: lineItems,
  };

  const response = await fetch('https://api.taxjar.com/v2/taxes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `TaxJar request failed with status ${response.status}`);
  }

  const json = (await response.json()) as {
    tax?: {
      amount_to_collect?: number;
      rate?: number;
      combined_tax_rate?: number;
    } & Record<string, unknown>;
  };

  const tax = json.tax ?? {};
  const rate = Number(
    Number.isFinite(tax.rate) ? tax.rate : Number.isFinite(tax.combined_tax_rate) ? tax.combined_tax_rate : 0,
  );
  const amountToCollect = Number((tax.amount_to_collect ?? 0).toFixed(2));

  return {
    amount: amountToCollect,
    rate,
    provider: 'taxjar',
    breakdown: tax as Record<string, unknown>,
    raw: json,
  };
}

export async function calculateOrderTax(input: TaxCalculationInput): Promise<TaxCalculationResult> {
  const integration = input.tenant.integrations;
  const provider = (integration?.taxProvider ?? 'builtin').toLowerCase();
  const config = parseTaxConfig(integration?.taxConfig ?? null);
  const rate =
    typeof integration?.defaultTaxRate === 'number' && Number.isFinite(integration.defaultTaxRate)
      ? integration.defaultTaxRate
      : config.fallbackRate ?? 0.0825;

  const subtotal = toNumber(input.subtotal);
  const shipping = toNumber(input.shipping);
  const surcharge = toNumber(input.surcharge);

  const warnings: string[] = [];

  if (provider === 'taxjar') {
    try {
      const result = await calculateWithTaxJar(
        {
          ...input,
          subtotal,
          shipping,
          surcharge,
        },
        config,
      );
      if (warnings.length > 0) {
        result.warnings = warnings;
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TaxJar calculation failed.';
      warnings.push(message);
    }
  }

  const fallback = calculateWithDefaultRate({
    subtotal,
    shipping,
    surcharge,
    rate,
    config,
  });

  fallback.provider = provider === 'builtin' ? 'builtin' : `${provider}-fallback`;
  if (warnings.length > 0) {
    fallback.warnings = warnings;
  }

  return fallback;
}
