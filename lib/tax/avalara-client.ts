/**
 * Avalara AvaTax API Client
 * 
 * Documentation: https://developer.avalara.com/api-reference/avatax/rest/v2/
 * 
 * Avalara provides real-time tax calculation for e-commerce transactions.
 * This client implements the Tax Calculation API.
 */

export interface AvalaraConfig {
  accountId: string;
  licenseKey: string;
  companyCode: string;
  environment?: 'sandbox' | 'production';
}

export interface AvalaraAddress {
  line1: string;
  line2?: string;
  city: string;
  region: string; // State
  postalCode: string;
  country: string;
}

export interface AvalaraLineItem {
  number: string;
  quantity: number;
  amount: number;
  taxCode?: string;
  description?: string;
}

export interface AvalaraTaxRequest {
  type: 'SalesOrder' | 'SalesInvoice';
  companyCode: string;
  date: string; // ISO 8601 format
  customerCode?: string;
  currencyCode: string;
  addresses: {
    ShipFrom?: AvalaraAddress;
    ShipTo: AvalaraAddress;
  };
  lines: AvalaraLineItem[];
  commit?: boolean;
}

export interface AvalaraTaxResponse {
  totalTax: number;
  totalTaxable: number;
  totalExempt: number;
  totalAmount: number;
  taxLines: Array<{
    lineNumber: string;
    taxCode: string;
    taxability: boolean;
    rate: number;
    tax: number;
    taxCalculated: number;
    taxDetails: Array<{
      jurisdictionType: string;
      jurisdictionName: string;
      taxName: string;
      rate: number;
      taxable: number;
      tax: number;
    }>;
  }>;
  summary: Array<{
    country: string;
    region: string;
    jurisType: string;
    jurisName: string;
    taxName: string;
    rate: number;
    taxable: number;
    tax: number;
    nonTaxable: number;
    exemption: number;
  }>;
}

/**
 * Get Avalara API base URL based on environment
 */
function getAvalaraBaseUrl(environment: 'sandbox' | 'production' = 'production'): string {
  return environment === 'sandbox'
    ? 'https://sandbox-rest.avatax.com'
    : 'https://rest.avatax.com';
}

/**
 * Create Avalara API client
 */
export function createAvalaraClient(config: AvalaraConfig) {
  const baseUrl = getAvalaraBaseUrl(config.environment || 'production');
  const auth = Buffer.from(`${config.accountId}:${config.licenseKey}`).toString('base64');

  return {
    /**
     * Calculate tax for a transaction
     */
    async calculateTax(request: Omit<AvalaraTaxRequest, 'companyCode'>): Promise<AvalaraTaxResponse> {
      const url = `${baseUrl}/api/v2/transactions/create`;
      
      const payload: AvalaraTaxRequest = {
        ...request,
        companyCode: config.companyCode,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'X-Avalara-Client': 'Alessa-Ordering/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Avalara API error (${response.status})`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Transform Avalara response to our format
      return {
        totalTax: data.totalTax || 0,
        totalTaxable: data.totalAmount || 0,
        totalExempt: data.totalExempt || 0,
        totalAmount: data.totalAmount || 0,
        taxLines: (data.lines || []).map((line: any) => ({
          lineNumber: line.number || '',
          taxCode: line.taxCode || '',
          taxability: line.taxability || false,
          rate: line.rate || 0,
          tax: line.tax || 0,
          taxCalculated: line.taxCalculated || 0,
          taxDetails: (line.details || []).map((detail: any) => ({
            jurisdictionType: detail.jurisdictionType || '',
            jurisdictionName: detail.jurisdictionName || '',
            taxName: detail.taxName || '',
            rate: detail.rate || 0,
            taxable: detail.taxable || 0,
            tax: detail.tax || 0,
          })),
        })),
        summary: (data.summary || []).map((summary: any) => ({
          country: summary.country || '',
          region: summary.region || '',
          jurisType: summary.jurisType || '',
          jurisName: summary.jurisName || '',
          taxName: summary.taxName || '',
          rate: summary.rate || 0,
          taxable: summary.taxable || 0,
          tax: summary.tax || 0,
          nonTaxable: summary.nonTaxable || 0,
          exemption: summary.exemption || 0,
        })),
      };
    },

    /**
     * Validate connection by making a test request
     */
    async validateConnection(): Promise<boolean> {
      try {
        const url = `${baseUrl}/api/v2/companies`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'X-Avalara-Client': 'Alessa-Ordering/1.0',
          },
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Parse Avalara configuration from tenant integration
 */
export function parseAvalaraConfig(config: any): AvalaraConfig | null {
  if (!config || typeof config !== 'object') {
    return null;
  }

  const accountId = config.accountId || process.env.AVALARA_ACCOUNT_ID;
  const licenseKey = config.licenseKey || process.env.AVALARA_LICENSE_KEY;
  const companyCode = config.companyCode || process.env.AVALARA_COMPANY_CODE;

  if (!accountId || !licenseKey || !companyCode) {
    return null;
  }

  return {
    accountId,
    licenseKey,
    companyCode,
    environment: config.environment || process.env.AVALARA_ENVIRONMENT || 'production',
  };
}









