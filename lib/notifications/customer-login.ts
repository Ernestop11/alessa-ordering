import {
  resendClient,
  resendFromEmail,
  twilioClient,
  twilioFromNumber,
} from './providers';

type SendResult =
  | { ok: true }
  | { ok: false; reason: string; error?: unknown };

interface EmailPayload {
  to: string;
  code: string;
  tenantName: string;
}

interface SmsPayload {
  to: string;
  code: string;
  tenantName: string;
}

export async function sendCustomerLoginEmailOTP(
  payload: EmailPayload,
): Promise<SendResult> {
  if (!resendClient || !resendFromEmail) {
    return { ok: false, reason: 'Resend email provider is not configured' };
  }

  try {
    await resendClient.emails.send({
      from: resendFromEmail,
      to: payload.to,
      subject: `${payload.tenantName} login code`,
      text: [
        `Hi!`,
        ``,
        `Your ${payload.tenantName} login code is ${payload.code}.`,
        `The code expires in 15 minutes.`,
        ``,
        `If you did not request this code you can ignore this email.`,
      ].join('\n'),
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

