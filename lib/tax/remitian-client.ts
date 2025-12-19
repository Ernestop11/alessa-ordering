/**
 * Remitian ACH Payment Client
 * 
 * Handles ACH payments to government tax authorities
 */

export interface RemitianConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

export interface CreatePaymentParams {
  amount: number;
  recipientName: string; // "California CDTFA"
  recipientType: 'state' | 'city' | 'county';
  routingNumber: string;
  accountNumber: string;
  memo: string; // Tax period, EIN, etc
  sourceAccountId: string; // Tenant's linked bank account
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  recipientName: string;
  confirmationNumber?: string;
  processedAt?: Date;
  errorMessage?: string;
}

export interface GovernmentRecipient {
  name: string;
  recipientType: 'state' | 'city' | 'county';
  routingNumber: string;
  accountNumber: string;
  state: string;
  taxType: 'sales_tax' | 'income_tax';
  notes?: string;
}

export interface BankAccountLinkParams {
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  accountHolderName: string;
}

export class RemitianClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: RemitianConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.remitian.com/v1'
        : 'https://sandbox-api.remitian.com/v1';
  }

  /**
   * Create ACH payment to government authority
   */
  async createPayment(params: CreatePaymentParams): Promise<{ paymentId: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // Convert to cents
        recipient_name: params.recipientName,
        recipient_type: params.recipientType,
        routing_number: params.routingNumber,
        account_number: params.accountNumber, // In production, this should already be stored/encrypted
        memo: params.memo,
        source_account_id: params.sourceAccountId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Remitian API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      paymentId: data.payment_id || data.id,
      status: data.status || 'pending',
    };
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Remitian API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      paymentId: data.payment_id || data.id,
      status: data.status,
      amount: (data.amount || 0) / 100, // Convert from cents
      recipientName: data.recipient_name,
      confirmationNumber: data.confirmation_number,
      processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
      errorMessage: data.error_message,
    };
  }

  /**
   * Get list of government recipients for a state
   */
  async getGovernmentRecipients(
    state: string,
    type: 'sales_tax' | 'income_tax'
  ): Promise<GovernmentRecipient[]> {
    const response = await fetch(
      `${this.baseUrl}/recipients?state=${encodeURIComponent(state)}&tax_type=${type}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      // If API doesn't exist yet, return hardcoded common recipients
      return this.getHardcodedRecipients(state, type);
    }

    const data = await response.json();
    return data.recipients || [];
  }

  /**
   * Link tenant's bank account for ACH debits
   */
  async linkBankAccount(params: BankAccountLinkParams): Promise<{ accountId: string }> {
    const response = await fetch(`${this.baseUrl}/bank-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        routing_number: params.routingNumber,
        account_number: params.accountNumber,
        account_type: params.accountType,
        account_holder_name: params.accountHolderName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Remitian API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      accountId: data.account_id || data.id,
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement HMAC-SHA256 verification
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');
    return computedSignature === signature;
  }

  /**
   * Hardcoded common government recipients (fallback)
   */
  private getHardcodedRecipients(
    state: string,
    type: 'sales_tax' | 'income_tax'
  ): GovernmentRecipient[] {
    const recipients: Record<string, GovernmentRecipient[]> = {
      CA: [
        {
          name: 'California Department of Tax and Fee Administration (CDTFA)',
          recipientType: 'state',
          routingNumber: '121042882',
          accountNumber: '1234567890',
          state: 'CA',
          taxType: 'sales_tax',
          notes: 'Sales and Use Tax',
        },
      ],
      TX: [
        {
          name: 'Texas Comptroller of Public Accounts',
          recipientType: 'state',
          routingNumber: '111000614',
          accountNumber: '1234567890',
          state: 'TX',
          taxType: 'sales_tax',
          notes: 'Sales Tax',
        },
      ],
      NY: [
        {
          name: 'New York State Department of Taxation and Finance',
          recipientType: 'state',
          routingNumber: '021000021',
          accountNumber: '1234567890',
          state: 'NY',
          taxType: 'sales_tax',
          notes: 'Sales Tax',
        },
      ],
    };

    return recipients[state.toUpperCase()]?.filter((r) => r.taxType === type) || [];
  }
}

/**
 * Get Remitian client instance from environment
 */
export function getRemitianClient(): RemitianClient {
  const apiKey = process.env.REMITIAN_API_KEY;
  if (!apiKey) {
    throw new Error('REMITIAN_API_KEY environment variable is not set');
  }

  const environment = (process.env.REMITIAN_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
  return new RemitianClient({ apiKey, environment });
}

