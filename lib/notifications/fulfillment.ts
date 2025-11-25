import {
  resendClient,
  resendFromEmail,
  twilioClient,
  twilioFromNumber,
} from './providers';
import type { SerializedOrder } from '../order-serializer';

type SendResult =
  | { ok: true }
  | { ok: false; reason: string; error?: unknown };

interface NotificationTargets {
  email?: string | null;
  phone?: string | null;
}

function formatOrderSummary(order: SerializedOrder): string {
  const parts: string[] = [];
  const orderId = order.id.slice(-6).toUpperCase();
  parts.push(`Order ${orderId} – ${order.fulfillmentMethod?.toUpperCase() ?? 'PICKUP'}`);
  parts.push(`Total: $${Number(order.totalAmount ?? 0).toFixed(2)}`);
  if (order.customerName) {
    parts.push(`Customer: ${order.customerName}`);
  }
  if (order.customerPhone) {
    parts.push(`Phone: ${order.customerPhone}`);
  }
  if (order.deliveryAddress?.line1) {
    parts.push(
      `Address: ${order.deliveryAddress.line1}${
        order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''
      } ${order.deliveryAddress.city ?? ''} ${order.deliveryAddress.state ?? ''} ${order.deliveryAddress.postalCode ?? ''}`.trim(),
    );
  }
  return parts.join('\n');
}

export async function sendFulfillmentEmailNotification(params: {
  tenantName: string;
  recipient: string;
  order: SerializedOrder;
}): Promise<SendResult> {
  if (!resendClient || !resendFromEmail) {
    return { ok: false, reason: 'Resend email provider is not configured' };
  }

  const summary = formatOrderSummary(params.order);
  const subject = `New ${params.tenantName} order received`;
  const text = [
    `A new order just came in for ${params.tenantName}.`,
    ``,
    summary,
    ``,
    `View the dashboard to acknowledge or print tickets.`,
  ].join('\n');

  try {
    await resendClient.emails.send({
      from: resendFromEmail,
      to: params.recipient,
      subject,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.error('[notifications] Fulfillment email failed', error);
    return { ok: false, reason: 'Failed to send fulfillment email', error };
  }
}

export async function sendFulfillmentSmsNotification(params: {
  tenantName: string;
  recipient: string;
  order: SerializedOrder;
}): Promise<SendResult> {
  if (!twilioClient || !twilioFromNumber) {
    return { ok: false, reason: 'Twilio SMS provider is not configured' };
  }

  const orderId = params.order.id.slice(-6).toUpperCase();
  const total = Number(params.order.totalAmount ?? 0).toFixed(2);
  const method = params.order.fulfillmentMethod ?? 'pickup';

  const body = `New ${params.tenantName} order ${orderId} (${method}): $${total}. Check fulfillment dashboard.`;

  try {
    await twilioClient.messages.create({
      body,
      from: twilioFromNumber,
      to: params.recipient,
    });
    return { ok: true };
  } catch (error) {
    console.error('[notifications] Fulfillment SMS failed', error);
    return { ok: false, reason: 'Failed to send fulfillment SMS', error };
  }
}

export async function notifyFulfillmentTeam(params: {
  tenantName: string;
  targets: NotificationTargets;
  order: SerializedOrder;
}): Promise<{ email?: SendResult; sms?: SendResult }> {
  const results: { email?: SendResult; sms?: SendResult } = {};
  const tasks: Array<Promise<void>> = [];

  if (params.targets.email) {
    tasks.push(
      sendFulfillmentEmailNotification({
        tenantName: params.tenantName,
        recipient: params.targets.email,
        order: params.order,
      }).then((result) => {
        results.email = result;
      }),
    );
  }

  if (params.targets.phone) {
    const phoneNumber =
      params.targets.phone.startsWith('+')
        ? params.targets.phone
        : `+1${params.targets.phone.replace(/\D/g, '')}`;
    tasks.push(
      sendFulfillmentSmsNotification({
        tenantName: params.tenantName,
        recipient: phoneNumber,
        order: params.order,
      }).then((result) => {
        results.sms = result;
      }),
    );
  }

  if (tasks.length === 0) {
    return results;
  }

  await Promise.all(tasks);
  return results;
}

