import {
  resendClient,
  resendFromEmail,
  twilioClient,
  twilioFromNumber,
  getTenantFromEmail,
} from './providers';

type SendResult =
  | { ok: true }
  | { ok: false; reason: string; error?: unknown };

interface TenantBranding {
  logo?: string | null;
  primaryColor?: string | null;
  customDomain?: string | null;
  emailDomainVerified?: boolean;
}

interface EmailPayload {
  to: string;
  code: string;
  tenantName: string;
  tenantSlug?: string;
  branding?: TenantBranding;
}

interface SmsPayload {
  to: string;
  code: string;
  tenantName: string;
}

function buildFullLogoUrl(logoUrl: string | null | undefined, tenantSlug?: string, customDomain?: string | null): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : tenantSlug ? `https://${tenantSlug}.alessacloud.com` : 'https://alessacloud.com';
  return `${baseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
}

function buildLoginCodeEmailHtml(params: {
  tenantName: string;
  tenantSlug?: string;
  code: string;
  branding?: TenantBranding;
}): string {
  const { tenantName, tenantSlug, code, branding } = params;
  const primaryColor = branding?.primaryColor || '#dc2626';
  const logoUrl = buildFullLogoUrl(branding?.logo, tenantSlug, branding?.customDomain);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
  <tr>
    <td style="padding:32px 24px;background:${primaryColor};text-align:center;">
      ${logoUrl ? `
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="background:#ffffff;border-radius:50%;width:90px;height:90px;text-align:center;vertical-align:middle;box-shadow:0 2px 10px rgba(0,0,0,0.2);">
              <img src="${logoUrl}" alt="${tenantName}" width="70" height="70" style="display:block;margin:0 auto;max-height:70px;max-width:70px;">
            </td>
          </tr>
        </table>
      ` : `<h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">${tenantName}</h1>`}
    </td>
  </tr>
  <tr>
    <td style="padding:32px 24px;text-align:center;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#000;font-weight:700;">Your Login Code</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">Enter this code to sign in to ${tenantName}</p>

      <div style="background:linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);border-radius:12px;padding:24px;margin:0 auto;max-width:280px;border:2px dashed ${primaryColor};">
        <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:8px;color:${primaryColor};">${code}</p>
      </div>

      <p style="margin:24px 0 0;color:#999;font-size:13px;">
        This code expires in <strong>15 minutes</strong>
      </p>
      <p style="margin:8px 0 0;color:#999;font-size:12px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#999;">Powered by AlessaCloud</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function sendCustomerLoginEmailOTP(
  payload: EmailPayload,
): Promise<SendResult> {
  if (!resendClient || !resendFromEmail) {
    return { ok: false, reason: 'Resend email provider is not configured' };
  }

  // Get the appropriate from email (tenant's verified domain or fallback)
  const fromEmail = getTenantFromEmail({
    tenantName: payload.tenantName,
    customDomain: payload.branding?.customDomain,
    emailDomainVerified: payload.branding?.emailDomainVerified,
  });

  // Build HTML email with branding
  const html = buildLoginCodeEmailHtml({
    tenantName: payload.tenantName,
    tenantSlug: payload.tenantSlug,
    code: payload.code,
    branding: payload.branding,
  });

  // Plain text fallback
  const text = [
    `Hi!`,
    ``,
    `Your ${payload.tenantName} login code is ${payload.code}.`,
    `The code expires in 15 minutes.`,
    ``,
    `If you did not request this code you can ignore this email.`,
  ].join('\n');

  try {
    await resendClient.emails.send({
      from: fromEmail,
      to: payload.to,
      subject: `${payload.tenantName} login code`,
      html,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.error('[notifications] Resend email OTP failed', error);
    return { ok: false, reason: 'Failed to send email login code', error };
  }
}

export async function sendCustomerLoginSmsOTP(
  payload: SmsPayload,
): Promise<SendResult> {
  if (!twilioClient || !twilioFromNumber) {
    return { ok: false, reason: 'Twilio SMS provider is not configured' };
  }

  try {
    await twilioClient.messages.create({
      body: `${payload.tenantName} login code: ${payload.code}. It expires in 15 minutes.`,
      from: twilioFromNumber,
      to: payload.to,
    });
    return { ok: true };
  } catch (error) {
    console.error('[notifications] Twilio SMS OTP failed', error);
    return { ok: false, reason: 'Failed to send SMS login code', error };
  }
}

