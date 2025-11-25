import { createRequire } from 'node:module';

const requireModule = createRequire(import.meta.url);
const RESEND_PACKAGE_NAME = ['re', 'send'].join('');
const TWILIO_PACKAGE_NAME = ['twi', 'lio'].join('');

interface ResendClient {
  emails: {
    send(payload: {
      from: string;
      to: string;
      subject: string;
      text: string;
    }): Promise<unknown>;
  };
}

type ResendConstructor = new (apiKey: string) => ResendClient;

interface TwilioClient {
  messages: {
    create(payload: { body: string; from: string; to: string }): Promise<unknown>;
  };
}

type TwilioFactory = (accountSid: string, authToken: string) => TwilioClient;

const resendApiKey = process.env.RESEND_API_KEY;

export const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ??
  process.env.RESEND_LOGIN_FROM_EMAIL ??
  null;

function loadResend(): ResendConstructor | null {
  try {
    const resendModule = requireModule(RESEND_PACKAGE_NAME);
    if (resendModule?.Resend) return resendModule.Resend as ResendConstructor;
    if (typeof resendModule === 'function') return resendModule as ResendConstructor;
    if (resendModule?.default) return resendModule.default as ResendConstructor;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[notifications] Resend SDK is not installed. Email will be disabled.', error);
    }
  }
  return null;
}

const ResendSDK = loadResend();

export const resendClient: ResendClient | null = resendApiKey && ResendSDK
  ? new ResendSDK(resendApiKey)
  : null;

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

export const twilioFromNumber =
  process.env.TWILIO_FROM_NUMBER ??
  process.env.TWILIO_SMS_FROM_NUMBER ??
  null;

function loadTwilio(): TwilioFactory | null {
  try {
    const twilioModule = requireModule(TWILIO_PACKAGE_NAME);
    if (typeof twilioModule === 'function') {
      return twilioModule as TwilioFactory;
    }
    if (twilioModule?.default && typeof twilioModule.default === 'function') {
      return twilioModule.default as TwilioFactory;
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[notifications] Twilio SDK is not installed. SMS will be disabled.', error);
    }
  }
  return null;
}

const twilioFactory = loadTwilio();

export const twilioClient: TwilioClient | null =
  twilioAccountSid && twilioAuthToken && twilioFactory
    ? twilioFactory(twilioAccountSid, twilioAuthToken)
    : null;

export function isEmailNotificationsConfigured(): boolean {
  return Boolean(resendClient && resendFromEmail);
}

export function isSmsNotificationsConfigured(): boolean {
  return Boolean(twilioClient && twilioFromNumber);
}
