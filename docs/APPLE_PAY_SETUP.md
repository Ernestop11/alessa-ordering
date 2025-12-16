# Apple Pay Setup Guide

This guide explains how to set up Apple Pay for the Alessa Ordering system.

## Prerequisites

1. **Apple Developer Account** (paid membership required)
2. **Merchant ID** from Apple Developer Portal
3. **Payment Processing Certificate** (.pem file)
4. **Private Key** for the certificate
5. **Domain Registration** in Apple Pay Merchant Identity

## Step 1: Create Merchant ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/merchant)
2. Click the "+" button to create a new Merchant ID
3. Enter a unique identifier (e.g., `merchant.com.alessa.ordering`)
4. Register this Merchant ID

## Step 2: Register Your Domain

1. In Apple Developer Portal, go to **Certificates, Identifiers & Profiles**
2. Select your Merchant ID
3. Click **Edit** and add your domain(s):
   - `lasreinascolusa.com`
   - `www.lasreinascolusa.com`
   - Any other custom domains
4. Download the domain verification file and place it at `/.well-known/apple-developer-merchantid-domain-association`
5. Verify the domain is accessible via HTTPS

## Step 3: Create Payment Processing Certificate

1. In Apple Developer Portal, go to **Certificates**
2. Click **+** to create a new certificate
3. Select **Apple Pay Payment Processing Certificate**
4. Choose your Merchant ID
5. Follow the instructions to create a Certificate Signing Request (CSR)
6. Upload the CSR and download the certificate (.cer file)
7. Convert to PEM format:
   ```bash
   openssl x509 -inform DER -in certificate.cer -out certificate.pem
   ```

## Step 4: Generate Private Key

If you don't have a private key, generate one:

```bash
openssl genrsa -out apple-pay-key.pem 2048
```

## Step 5: Configure Environment Variables

Add to your `.env` file:

```bash
# Apple Pay Configuration
APPLE_PAY_MERCHANT_ID=merchant.com.alessa.ordering
APPLE_PAY_CERTIFICATE_PATH=/path/to/certificate.pem
APPLE_PAY_KEY_PATH=/path/to/apple-pay-key.pem

# Or use base64-encoded content (for cloud deployments)
APPLE_PAY_CERTIFICATE_CONTENT="-----BEGIN CERTIFICATE-----\n..."
APPLE_PAY_KEY_CONTENT="-----BEGIN PRIVATE KEY-----\n..."

# Optional: Custom display name
APPLE_PAY_DISPLAY_NAME=Las Reinas
```

## Step 6: Configure via Tenant Integration (Alternative)

You can also configure Apple Pay per-tenant via the database:

1. Set `applePayMerchantId` in `TenantIntegration` table
2. Store certificate content in `applePayPaymentProcessingCertificate` field

## Step 7: Test Apple Pay

1. Use Safari on macOS or iOS device
2. Add a test card to Apple Wallet
3. Visit your ordering site and add items to cart
4. Click the Apple Pay button in the payment form
5. Complete the payment using Face ID, Touch ID, or passcode

## Troubleshooting

### "Apple Pay validation failed"

- Check that `APPLE_PAY_MERCHANT_ID` is set correctly
- Verify certificate and key paths are correct
- Ensure certificate is in PEM format
- Check that domain is registered in Apple Developer Portal
- Verify domain verification file is accessible

### "Payment method not available"

- Apple Pay only works in Safari on macOS/iOS
- Ensure device has Apple Pay set up
- Check that test cards are added to Apple Wallet

### Certificate errors

- Ensure certificate and key match (from the same CSR)
- Verify certificate hasn't expired
- Check file permissions on certificate/key files

## Production Checklist

- [ ] Merchant ID created and registered
- [ ] Domain(s) registered in Apple Pay Merchant Identity
- [ ] Domain verification file accessible via HTTPS
- [ ] Payment Processing Certificate created and converted to PEM
- [ ] Private key generated and secured
- [ ] Environment variables configured
- [ ] Tested in Safari on macOS/iOS
- [ ] Tested with real Apple Pay cards (in production mode)

## Security Notes

- Never commit certificate files or private keys to version control
- Use environment variables or secure secret management
- Rotate certificates before expiration
- Keep private keys secure and backed up

## References

- [Apple Pay JS Documentation](https://developer.apple.com/documentation/apple_pay_on_the_web)
- [Stripe Payment Request API](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Apple Developer Portal](https://developer.apple.com/account)







