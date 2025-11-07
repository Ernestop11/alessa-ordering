# Stripe Test Checkout

Use these steps to exercise the checkout without touching live funds. Everything runs in Stripe test mode (no real charges).

## 1. Prerequisites

- `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must point to your **test** keys (`sk_test_...` / `pk_test_...`).
- `STRIPE_WEBHOOK_SECRET` should be the signing secret from a test-mode webhook endpoint (see step 4).
- Run the dev server with `npm run dev`.

## 2. Launch the storefront

1. Visit `http://localhost:3000/order`.
2. Add a few menu items to the cart.
3. Open the cart (bottom-right button) and complete the contact/delivery form.

## 3. Test card payments

When the Payment Element renders:

| Scenario              | Card Number        | Expiry | CVC | Result                      |
|-----------------------|--------------------|--------|-----|-----------------------------|
| Successful charge     | `4242 4242 4242 4242` | 12/34 | 123 | Payment confirms instantly. |
| Declined card         | `4000 0000 0000 0002` | 12/34 | 123 | Payment fails with decline. |
| 3DS challenge         | `4000 0027 6000 3184` | 12/34 | 123 | Stripe modal asks to authenticate. |

Use any future-dated expiry and 3-digit CVC.

## 4. Webhook confirmation

To see orders advance to `confirmed`:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the signing secret from the CLI output into `.env` (`STRIPE_WEBHOOK_SECRET=whsec_...`). When you submit a successful test payment, Stripe fires `payment_intent.succeeded` and the webhook creates the order record.

## 5. Apple Pay simulation

Stripe test mode cannot complete Apple Pay without a real merchant certificate, but you can preview the experience:

1. Use Safari on macOS/iOS with a test Apple Pay wallet.
2. On the Payment Element, choose the Apple Pay option (it renders if the browser is eligible).
3. The confirmation will fail because no merchant certificate is configured, but the UI flow lets you verify styling and button placement.

Once you obtain a production certificate from Apple, configure the merchant ID and certificate paths in your deployment environment and remove the mock response in `app/api/payments/apple/validate/route.ts`.

## 6. Admin review

After a successful test payment, open `/admin` → Orders to see the order marked `confirmed`. Update the status to walk it through `preparing → ready → completed`.

That’s it—repeat the scenarios above to validate the full checkout loop.
