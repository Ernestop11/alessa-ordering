import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import type { OrderPayload } from "@/lib/order-service";
import { getStripeClient } from "@/lib/stripe";
import { normalizeOrderPayload } from "@/lib/payments/normalize-order-payload";
import type Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const orderPayload = normalizeOrderPayload(body.order);
    if (!orderPayload) {
      console.error("[stripe] Missing or invalid order payload", body);
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    let stripe;
    try {
      stripe = getStripeClient();
    } catch (err) {
      console.error("[stripe] Client initialization failed", err);
      return NextResponse.json({ error: "Stripe is not configured for this environment." }, { status: 500 });
    }

    const currency = typeof body.currency === "string" ? body.currency : body.order?.currency || "usd";
    const derivedAmount =
      typeof body.amount === "number" && Number.isFinite(body.amount)
        ? Math.round(body.amount)
        : Math.round(Number(orderPayload.totalAmount ?? 0) * 100);

    if (!derivedAmount || Number.isNaN(derivedAmount) || derivedAmount <= 0) {
      console.error("[stripe] Missing or invalid amount in request body", body);
      return NextResponse.json({ error: "Missing amount" }, { status: 400 });
    }

    let accountId = tenant.integrations?.stripeAccountId;
    const isConnectAccount = accountId && tenant.integrations?.stripeChargesEnabled;

    console.log("[stripe] Payment Intent Creation:", {
      tenantSlug: tenant.slug,
      accountId: accountId || "null (direct integration)",
      mode: isConnectAccount ? "Stripe Connect" : "Direct Integration",
      chargesEnabled: tenant.integrations?.stripeChargesEnabled || false,
      onboardingComplete: tenant.integrations?.stripeOnboardingComplete || false,
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) || "not set",
      publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) || "not set",
    });

    // Only use Stripe Connect if account is fully onboarded and charges enabled
    if (!isConnectAccount) {
      accountId = undefined; // Use platform account as fallback
      console.log("[stripe] Using direct Stripe integration (platform account) - Stripe Connect not fully configured");
    } else {
      console.log("[stripe] Using Stripe Connect account:", accountId);
    }

    const platformPercentFee = tenant.integrations?.platformPercentFee ?? 0;
    const platformFlatFee = tenant.integrations?.platformFlatFee ?? 0;
    const applicationFeeAmount = Math.max(0, orderPayload.subtotalAmount * platformPercentFee + platformFlatFee);
    const applicationFeeCents = Math.round(applicationFeeAmount * 100);
    const cappedApplicationFeeCents = Math.min(applicationFeeCents, derivedAmount);

    const intentMetadata = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      customer: orderPayload.customerName || "Guest",
    };

    // Create payment intent - use direct integration for dev, Stripe Connect for production
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: derivedAmount,
      currency,
      metadata: intentMetadata,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Only add application fee and stripe account for Stripe Connect mode
    if (accountId) {
      paymentIntentOptions.application_fee_amount = cappedApplicationFeeCents;
    }

    const paymentIntent = accountId
      ? await stripe.paymentIntents.create(paymentIntentOptions, { stripeAccount: accountId })
      : await stripe.paymentIntents.create(paymentIntentOptions);

    const orderData = JSON.parse(JSON.stringify(orderPayload)) as Prisma.JsonObject;

    const paymentSession = await prisma.paymentSession.create({
      data: {
        tenantId: tenant.id,
        paymentIntentId: paymentIntent.id,
        amount: derivedAmount,
        currency,
        status: "pending",
        orderData,
      },
    });

    // Update payment intent with payment session ID
    if (accountId) {
      await stripe.paymentIntents.update(
        paymentIntent.id,
        {
          metadata: {
            ...intentMetadata,
            paymentSessionId: paymentSession.id,
          },
        },
        {
          stripeAccount: accountId,
        },
      );
    } else {
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...intentMetadata,
          paymentSessionId: paymentSession.id,
        },
      });
    }

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: "stripe",
        message: "Payment intent created",
        payload: {
          paymentIntentId: paymentIntent.id,
          paymentSessionId: paymentSession.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          applicationFeeAmount: paymentIntent.application_fee_amount ?? cappedApplicationFeeCents,
        },
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentSessionId: paymentSession.id,
      stripeAccount: accountId || undefined, // Include account ID if using Stripe Connect
    });
  } catch (error: any) {
    console.error("[stripe] Error creating payment intent", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
