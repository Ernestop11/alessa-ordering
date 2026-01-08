import { Resend } from 'resend';

interface ResendClient {
  emails: {
    send(payload: {
      from: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
    }): Promise<unknown>;
  };
}

interface TwilioClient {
  messages: {
    create(payload: { body: string; from: string; to: string }): Promise<unknown>;
  };
}

const resendApiKey = process.env.RESEND_API_KEY;

export const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ??
  process.env.RESEND_LOGIN_FROM_EMAIL ??
  null;

// Debug log for notification provider configuration
console.log('[notifications] Provider init:', {
  hasResendKey: !!resendApiKey,
  hasResendFrom: !!resendFromEmail,
  keyPrefix: resendApiKey?.slice(0, 10),
});

export const resendClient: ResendClient | null = resendApiKey
  ? new Resend(resendApiKey)
  : null;

// Get the appropriate "from" email for a tenant
// Uses tenant's verified domain if available, otherwise falls back to alessacloud.com
export function getTenantFromEmail(params: {
  tenantName: string;
  customDomain?: string | null;
  emailDomainVerified?: boolean;
}): string {
  const { tenantName, customDomain, emailDomainVerified } = params;

  // If tenant has a verified custom domain, use it
  if (emailDomainVerified && customDomain) {
    // Use noreply@domain.com format
    return `${tenantName} <noreply@${customDomain}>`;
  }

  // Fall back to default alessacloud.com domain
  return resendFromEmail || 'noreply@alessacloud.com';
}

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

export const twilioFromNumber =
  process.env.TWILIO_FROM_NUMBER ??
  process.env.TWILIO_SMS_FROM_NUMBER ??
  null;

// Twilio is optional - only load if credentials are provided
let twilioClient: TwilioClient | null = null;

if (twilioAccountSid && twilioAuthToken) {
  try {
    // Dynamic import for Twilio since it's optional
    const twilio = require('twilio');
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  } catch {
    console.warn('[notifications] Twilio SDK not available');
  }
}

export { twilioClient };

export function isEmailNotificationsConfigured(): boolean {
  return Boolean(resendClient && resendFromEmail);
}

export function isSmsNotificationsConfigured(): boolean {
  return Boolean(twilioClient && twilioFromNumber);
}
