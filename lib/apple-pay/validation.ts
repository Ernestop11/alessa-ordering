/**
 * Apple Pay Merchant Validation
 * 
 * Implements Apple Pay JS merchant validation as per:
 * https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_js_api/requesting_an_apple_pay_payment_session
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

export interface ApplePayMerchantConfig {
  merchantId: string;
  certificatePath?: string;
  keyPath?: string;
  certificateContent?: string;
  keyContent?: string;
  displayName?: string;
}

export interface ApplePayValidationResponse {
  merchantSession: {
    merchantIdentifier: string;
    domainName: string;
    displayName: string;
    initiative: 'web' | 'messaging';
    initiativeContext?: string;
    signature: string;
    expiresAt: number;
  };
}

/**
 * Load certificate and key from file paths or content
 */
function loadCertificateAndKey(config: ApplePayMerchantConfig): {
  certificate: string;
  key: string;
} {
  let certificate: string;
  let key: string;

  if (config.certificateContent && config.keyContent) {
    certificate = config.certificateContent;
    key = config.keyContent;
  } else if (config.certificatePath && config.keyPath) {
    certificate = fs.readFileSync(config.certificatePath, 'utf8');
    key = fs.readFileSync(config.keyPath, 'utf8');
  } else {
    throw new Error('Apple Pay certificate and key must be provided via paths or content');
  }

  return { certificate, key };
}

/**
 * Validate merchant with Apple Pay servers
 */
export async function validateApplePayMerchant(
  validationURL: string,
  config: ApplePayMerchantConfig
): Promise<ApplePayValidationResponse> {
  if (!validationURL || !validationURL.startsWith('https://')) {
    throw new Error('Invalid validation URL');
  }

  const { certificate, key } = loadCertificateAndKey(config);

  // Parse the validation URL to extract domain
  const url = new URL(validationURL);
  const domainName = url.hostname;

  // Create the merchant session request payload
  const payload = JSON.stringify({
    merchantIdentifier: config.merchantId,
    domainName,
    displayName: config.displayName || 'Alessa Ordering',
  });

  // Make HTTPS request to Apple's validation endpoint
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      key,
      cert: certificate,
    };

    const req = https.request(validationURL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Apple Pay validation failed: ${res.statusCode} - ${data}`));
          return;
        }

        try {
          const merchantSession = JSON.parse(data);
          
          // Calculate expiration (typically 5 minutes from now)
          const expiresAt = Date.now() + (5 * 60 * 1000);

          resolve({
            merchantSession: {
              ...merchantSession,
              expiresAt,
            },
          });
        } catch (error) {
          reject(new Error(`Failed to parse Apple Pay response: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Apple Pay validation request failed: ${error.message}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Get Apple Pay merchant configuration from environment or tenant settings
 */
export function getApplePayConfig(tenantIntegration?: {
  applePayMerchantId?: string | null;
  applePayPaymentProcessingCertificate?: string | null;
}): ApplePayMerchantConfig | null {
  // Try environment variables first
  const merchantId = process.env.APPLE_PAY_MERCHANT_ID;
  const certificatePath = process.env.APPLE_PAY_CERTIFICATE_PATH;
  const keyPath = process.env.APPLE_PAY_KEY_PATH;
  const certificateContent = process.env.APPLE_PAY_CERTIFICATE_CONTENT;
  const keyContent = process.env.APPLE_PAY_KEY_CONTENT;
  const displayName = process.env.APPLE_PAY_DISPLAY_NAME;

  // Fallback to tenant integration settings
  const finalMerchantId = merchantId || tenantIntegration?.applePayMerchantId || null;
  const finalCertificate = certificateContent || tenantIntegration?.applePayPaymentProcessingCertificate || null;

  if (!finalMerchantId) {
    return null;
  }

  // If we have certificate content but no key, we can't proceed
  if (finalCertificate && !keyContent && !keyPath) {
    console.warn('[Apple Pay] Certificate provided but no key found');
    return null;
  }

  return {
    merchantId: finalMerchantId,
    certificatePath,
    keyPath,
    certificateContent: finalCertificate || undefined,
    keyContent,
    displayName: displayName || undefined,
  };
}









