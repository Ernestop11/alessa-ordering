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

interface TenantBranding {
  logo?: string | null;
  primaryColor?: string | null;
}

function buildFulfillmentEmailHtml(params: {
  tenantName: string;
  tenantSlug: string;
  order: SerializedOrder;
  branding?: TenantBranding;
}): string {
  const { tenantName, tenantSlug, order, branding } = params;
  const orderId = order.id.slice(-6).toUpperCase();
  const total = Number(order.totalAmount ?? 0).toFixed(2);
  const method = order.fulfillmentMethod?.toUpperCase() ?? 'PICKUP';
  const primaryColor = branding?.primaryColor || '#dc2626';
  const adminUrl = `https://${tenantSlug}.alessacloud.com/admin/orders`;

  const items = order.items ?? [];
  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity}× ${item.menuItemName || 'Item'}${item.notes ? `<br><small style="color:#666;">→ ${item.notes}</small>` : ''}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${(Number(item.price ?? 0) * item.quantity).toFixed(2)}</td></tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
  <tr>
    <td style="padding:24px;background:${primaryColor};text-align:center;">
      ${branding?.logo ? `<img src="${branding.logo}" alt="${tenantName}" style="max-height:50px;max-width:200px;">` : `<h1 style="margin:0;color:#fff;font-size:24px;">${tenantName}</h1>`}
    </td>
  </tr>
  <tr>
    <td style="padding:24px;">
      <div style="background:#fef3c7;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#92400e;">NEW ORDER</p>
        <p style="margin:8px 0 0;font-size:28px;font-weight:bold;color:#000;">#${orderId}</p>
      </div>

      <table width="100%" style="margin-bottom:24px;">
        <tr>
          <td style="background:#f9fafb;padding:12px;border-radius:8px;">
            <p style="margin:0 0 4px;font-size:12px;color:#666;">Method</p>
            <p style="margin:0;font-weight:bold;color:#000;">${method}</p>
          </td>
          <td style="background:#f9fafb;padding:12px;border-radius:8px;">
            <p style="margin:0 0 4px;font-size:12px;color:#666;">Total</p>
            <p style="margin:0;font-weight:bold;color:${primaryColor};font-size:18px;">$${total}</p>
          </td>
        </tr>
      </table>

      <h3 style="margin:0 0 8px;font-size:14px;color:#666;">Customer</h3>
      <p style="margin:0 0 4px;font-weight:bold;">${order.customerName || 'Guest'}</p>
      ${order.customerPhone ? `<p style="margin:0 0 4px;color:#666;">${order.customerPhone}</p>` : ''}
      ${order.customerEmail ? `<p style="margin:0 0 16px;color:#666;">${order.customerEmail}</p>` : ''}

      ${order.deliveryAddress?.line1 ? `
      <h3 style="margin:16px 0 8px;font-size:14px;color:#666;">Delivery Address</h3>
      <p style="margin:0 0 16px;">${order.deliveryAddress.line1}${order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}<br>${order.deliveryAddress.city || ''} ${order.deliveryAddress.state || ''} ${order.deliveryAddress.postalCode || ''}</p>
      ` : ''}

      <h3 style="margin:16px 0 8px;font-size:14px;color:#666;">Items</h3>
      <table width="100%" style="border-collapse:collapse;">
        ${itemsHtml}
      </table>

      ${order.notes ? `
      <div style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:8px;">
        <p style="margin:0;font-size:12px;color:#92400e;font-weight:bold;">NOTES</p>
        <p style="margin:4px 0 0;color:#000;">${order.notes}</p>
      </div>
      ` : ''}

      <a href="${adminUrl}" style="display:block;margin-top:24px;padding:14px 24px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:bold;">
        Open Fulfillment Dashboard
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px;background:#f9fafb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#666;">Powered by AlessaCloud</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function sendFulfillmentEmailNotification(params: {
  tenantName: string;
  tenantSlug: string;
  recipient: string;
  order: SerializedOrder;
  branding?: TenantBranding;
}): Promise<SendResult> {
  if (!resendClient || !resendFromEmail) {
    return { ok: false, reason: 'Resend email provider is not configured' };
  }

  const orderId = params.order.id.slice(-6).toUpperCase();
  const subject = `🔔 New Order #${orderId} - ${params.tenantName}`;

  const html = buildFulfillmentEmailHtml({
    tenantName: params.tenantName,
    tenantSlug: params.tenantSlug,
    order: params.order,
    branding: params.branding,
  });

  // Plain text fallback
  const items = params.order.items ?? [];
  const itemsList = items
    .map((item) => `• ${item.quantity}x ${item.menuItemName || 'Item'} - $${Number(item.price ?? 0).toFixed(2)}`)
    .join('\n');

  const text = [
    `NEW ORDER #${orderId}`,
    ``,
    `Method: ${params.order.fulfillmentMethod?.toUpperCase() ?? 'PICKUP'}`,
    `Total: $${Number(params.order.totalAmount ?? 0).toFixed(2)}`,
    ``,
    `Customer: ${params.order.customerName || 'Guest'}`,
    params.order.customerPhone ? `Phone: ${params.order.customerPhone}` : null,
    ``,
    `Items:`,
    itemsList,
    ``,
    params.order.notes ? `Notes: ${params.order.notes}` : null,
    ``,
    `Manage: https://${params.tenantSlug}.alessacloud.com/admin/orders`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await resendClient.emails.send({
      from: resendFromEmail,
      to: params.recipient,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.error('[notifications] Fulfillment email failed', error);
    return { ok: false, reason: 'Failed to send fulfillment email', error };
  }
}

// Customer order confirmation email with tracking link
export async function sendCustomerOrderConfirmation(params: {
  tenantName: string;
  tenantSlug: string;
  customerEmail: string;
  order: SerializedOrder;
  branding?: TenantBranding;
}): Promise<SendResult> {
  if (!resendClient || !resendFromEmail) {
    return { ok: false, reason: 'Resend email provider is not configured' };
  }

  const { tenantName, tenantSlug, order, branding } = params;
  const orderId = order.id.slice(-6).toUpperCase();
  const total = Number(order.totalAmount ?? 0).toFixed(2);
  const method = order.fulfillmentMethod?.toUpperCase() ?? 'PICKUP';
  const primaryColor = branding?.primaryColor || '#dc2626';
  const trackingUrl = `https://${tenantSlug}.alessacloud.com/track/${order.id}`;

  const items = order.items ?? [];
  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity}× ${item.menuItemName || 'Item'}${item.notes ? `<br><small style="color:#666;">→ ${item.notes}</small>` : ''}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${(Number(item.price ?? 0) * item.quantity).toFixed(2)}</td></tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
  <tr>
    <td style="padding:24px;background:${primaryColor};text-align:center;">
      ${branding?.logo ? `<img src="${branding.logo}" alt="${tenantName}" style="max-height:50px;max-width:200px;">` : `<h1 style="margin:0;color:#fff;font-size:24px;">${tenantName}</h1>`}
    </td>
  </tr>
  <tr>
    <td style="padding:24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h2 style="margin:0 0 8px;font-size:24px;color:#000;">Order Confirmed!</h2>
      <p style="margin:0;color:#666;">Thank you for your order, ${order.customerName || 'valued customer'}!</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 24px;">
      <div style="background:#f9fafb;border-radius:12px;padding:20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#666;">Order Number</p>
        <p style="margin:0 0 16px;font-size:32px;font-weight:bold;color:${primaryColor};">#${orderId}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#666;">${method}</p>
        <p style="margin:0;font-weight:bold;font-size:20px;">$${total}</p>
      </div>

      <a href="${trackingUrl}" style="display:block;margin-top:20px;padding:16px 24px;background:${primaryColor};color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:bold;font-size:16px;">
        📍 Track Your Order
      </a>
      <p style="margin:8px 0 0;text-align:center;font-size:12px;color:#666;">
        Get real-time updates on your order status
      </p>

      <h3 style="margin:24px 0 12px;font-size:14px;color:#666;border-bottom:1px solid #eee;padding-bottom:8px;">Order Summary</h3>
      <table width="100%" style="border-collapse:collapse;">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0 4px;font-weight:bold;">Subtotal</td>
          <td style="padding:12px 0 4px;text-align:right;">$${Number(order.subtotalAmount ?? 0).toFixed(2)}</td>
        </tr>
        ${Number(order.deliveryFee ?? 0) > 0 ? `<tr><td style="padding:4px 0;color:#666;">Delivery</td><td style="padding:4px 0;text-align:right;color:#666;">$${Number(order.deliveryFee).toFixed(2)}</td></tr>` : ''}
        <tr>
          <td style="padding:4px 0;color:#666;">Tax & Fees</td>
          <td style="padding:4px 0;text-align:right;color:#666;">$${(Number(order.taxAmount ?? 0) + Number(order.platformFee ?? 0)).toFixed(2)}</td>
        </tr>
        ${Number(order.tipAmount ?? 0) > 0 ? `<tr><td style="padding:4px 0;color:#666;">Tip</td><td style="padding:4px 0;text-align:right;color:#666;">$${Number(order.tipAmount).toFixed(2)}</td></tr>` : ''}
        <tr>
          <td style="padding:12px 0;font-weight:bold;font-size:18px;border-top:2px solid #000;">Total</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:18px;border-top:2px solid #000;color:${primaryColor};">$${total}</td>
        </tr>
      </table>

      ${order.notes ? `
      <div style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:8px;">
        <p style="margin:0;font-size:12px;color:#92400e;font-weight:bold;">Special Instructions</p>
        <p style="margin:4px 0 0;color:#000;">${order.notes}</p>
      </div>
      ` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px;background:#f9fafb;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:#666;">Questions? Contact ${tenantName}</p>
      <p style="margin:0;font-size:12px;color:#999;">Powered by AlessaCloud</p>
    </td>
  </tr>
</table>
</body>
</html>`;

  const subject = `✅ Order Confirmed #${orderId} - ${tenantName}`;

  try {
    await resendClient.emails.send({
      from: resendFromEmail,
      to: params.customerEmail,
      subject,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error('[notifications] Customer confirmation email failed', error);
    return { ok: false, reason: 'Failed to send customer confirmation email', error };
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
  tenantSlug: string;
  targets: NotificationTargets;
  order: SerializedOrder;
  branding?: TenantBranding;
}): Promise<{ email?: SendResult; sms?: SendResult; customerEmail?: SendResult }> {
  const results: { email?: SendResult; sms?: SendResult; customerEmail?: SendResult } = {};
  const tasks: Array<Promise<void>> = [];

  // Send fulfillment team notification
  if (params.targets.email) {
    tasks.push(
      sendFulfillmentEmailNotification({
        tenantName: params.tenantName,
        tenantSlug: params.tenantSlug,
        recipient: params.targets.email,
        order: params.order,
        branding: params.branding,
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

  // Send customer confirmation email with tracking link
  if (params.order.customerEmail) {
    tasks.push(
      sendCustomerOrderConfirmation({
        tenantName: params.tenantName,
        tenantSlug: params.tenantSlug,
        customerEmail: params.order.customerEmail,
        order: params.order,
        branding: params.branding,
      }).then((result) => {
        results.customerEmail = result;
      }),
    );
  }

  if (tasks.length === 0) {
    return results;
  }

  await Promise.all(tasks);
  return results;
}

