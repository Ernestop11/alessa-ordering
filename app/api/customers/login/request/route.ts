import crypto from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { maskEmail, maskPhone } from '@/lib/customer/login-masking';
import {
  sendCustomerLoginEmailOTP,
  sendCustomerLoginSmsOTP,
} from '@/lib/notifications/customer-login';

type LoginRequestBody =
  | { email: string; phone?: string }
  | { email?: string; phone: string };

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const body = (await req.json()) as LoginRequestBody;

  if (!body.email && !body.phone) {
    return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
  }

  const token = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let customer = await prisma.customer.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [
        body.email ? { email: body.email } : undefined,
        body.phone ? { phone: body.phone } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: body.email || null,
        phone: body.phone || null,
      },
    });
  }

  await prisma.customerSession.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      token,
      expiresAt,
    },
  });

  const deliveries: Array<{ channel: 'email' | 'sms'; destination: string }> = [];
  const debugExpose =
    process.env.CUSTOMER_LOGIN_DEBUG_TOKEN === 'true' || process.env.NODE_ENV !== 'production';

  if (customer.email) {
    deliveries.push({ channel: 'email', destination: customer.email });
  }

  if (customer.phone) {
    deliveries.push({ channel: 'sms', destination: customer.phone });
  }

  // Build branding info for emails
  const branding = {
    logo: tenant.logoUrl,
    primaryColor: tenant.primaryColor,
    customDomain: tenant.customDomain,
    emailDomainVerified: tenant.emailDomainVerified,
  };

  const sendAttempts = await Promise.all(
    deliveries.map(async (delivery) => {
      if (delivery.channel === 'email') {
        const result = await sendCustomerLoginEmailOTP({
          to: delivery.destination,
          code: token,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          branding,
        });
        if (!result.ok && debugExpose) {
          console.warn('[customer-login] Failed to send email OTP', result.reason);
        }
        if (result.ok && debugExpose) {
          console.info(`[customer-login] Email OTP queued for ${delivery.destination}: ${token}`);
        }
        return {
          ...delivery,
          success: result.ok,
          error: result.ok ? null : result.reason,
        };
      }

      const result = await sendCustomerLoginSmsOTP({
        to: delivery.destination,
        code: token,
        tenantName: tenant.name,
      });
      if (!result.ok && debugExpose) {
        console.warn('[customer-login] Failed to send SMS OTP', result.reason);
      }
      if (result.ok && debugExpose) {
        console.info(`[customer-login] SMS OTP queued for ${delivery.destination}: ${token}`);
      }
      return {
        ...delivery,
        success: result.ok,
        error: result.ok ? null : result.reason,
      };
    }),
  );

  const maskedDeliveries = sendAttempts.map((attempt) => ({
    channel: attempt.channel,
    destination: attempt.channel === 'email' ? maskEmail(attempt.destination) : maskPhone(attempt.destination),
    success: attempt.success,
    error: attempt.error,
  }));

  const successfulDeliveries = sendAttempts.filter((attempt) => attempt.success);

  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'customer-login',
      message:
        deliveries.length === 0
          ? 'Customer login code generated but no delivery channel available.'
          : successfulDeliveries.length > 0
            ? 'Customer login code delivered.'
            : 'Customer login code delivery failed.',
      payload: {
        customerId: customer.id,
        email: customer.email,
        phone: customer.phone,
        deliveries: maskedDeliveries,
        tokenPreview: `${token.slice(0, 4)}…`,
      },
    },
  });

  if (deliveries.length > 0 && successfulDeliveries.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'We were unable to send your login code. Please try again or contact the restaurant.',
        delivery: maskedDeliveries,
      },
      { status: 502 },
    );
  }

  let message: string;
  if (successfulDeliveries.length > 0) {
    message = `Your login code was sent to ${maskedDeliveries
      .filter((delivery) => delivery.success)
      .map((delivery) =>
        delivery.channel === 'email' ? `email ${delivery.destination}` : `phone ${delivery.destination}`,
      )
      .join(' & ')}.`;
  } else if (deliveries.length === 0) {
    message = 'Add an email address or phone number to receive login codes.';
  } else {
    message = 'We were unable to send your login code. Please try again or contact the restaurant.';
  }

  return NextResponse.json({
    ok: true,
    expiresAt,
    message,
    delivery: maskedDeliveries,
    ...(debugExpose ? { debugToken: token } : {}),
  });
}
