import { Resend } from 'resend';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured, email notifications will be skipped');
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

// Default sender domain for unverified tenants
const DEFAULT_FROM_DOMAIN = process.env.RESEND_DEFAULT_DOMAIN || 'resend.dev';
const DEFAULT_FROM_EMAIL = process.env.RESEND_DEFAULT_FROM || `orders@${DEFAULT_FROM_DOMAIN}`;

// Lazy load Prisma to avoid circular dependencies
let prismaClient: typeof import('@prisma/client').PrismaClient.prototype | null = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('./prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

// Helper to get the "from" address for a tenant
function getTenantFromAddress(tenant: {
  name: string;
  emailDomainVerified?: boolean;
  customDomain?: string | null;
  contactEmail?: string | null;
}): string {
  // If tenant has verified email domain, use it
  if (tenant.emailDomainVerified && tenant.customDomain) {
    return `${tenant.name} <orders@${tenant.customDomain}>`;
  }
  // Otherwise use the default Alessa domain
  return `${tenant.name} <${DEFAULT_FROM_EMAIL}>`;
}

// Helper to get reply-to address
function getTenantReplyTo(tenant: {
  contactEmail?: string | null;
  customDomain?: string | null;
}): string | undefined {
  // If tenant has contact email, use it for reply-to
  if (tenant.contactEmail) {
    return tenant.contactEmail;
  }
  // If tenant has custom domain but no contact email
  if (tenant.customDomain) {
    return `orders@${tenant.customDomain}`;
  }
  return undefined;
}

export interface OrderNotificationEmailParams {
  to: string;
  orderId: string;
  customerName: string | null;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  tenantName: string;
  tenantSlug: string; // Added for dynamic URL generation
  tenantCustomDomain?: string | null; // Added for dynamic URL generation
  fulfillmentUrl?: string;
  fromAddress?: string;
  replyTo?: string;
}

export async function sendOrderNotificationEmail({
  to,
  orderId,
  customerName,
  totalAmount,
  items,
  tenantName,
  tenantSlug,
  tenantCustomDomain,
  fulfillmentUrl,
  fromAddress,
  replyTo,
}: OrderNotificationEmailParams): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn('[email] Cannot send order notification - Resend not configured');
    return;
  }

  const orderItemsList = items
    .map((item) => `  • ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
    .join('\n');

  // Build tenant URL dynamically - no hardcoded fallbacks
  const rootDomain = process.env.ROOT_DOMAIN || 'alessacloud.com';
  const tenantBaseUrl = tenantCustomDomain
    ? `https://${tenantCustomDomain}`
    : `https://${tenantSlug}.${rootDomain}`;
  const dashboardUrl = fulfillmentUrl || `${tenantBaseUrl}/admin/fulfillment`;

  try {
    const { error } = await resend.emails.send({
      from: fromAddress || `${tenantName} Orders <${DEFAULT_FROM_EMAIL}>`,
      to: [to],
      replyTo: replyTo,
      subject: `🆕 New Order #${orderId.slice(0, 8)} - $${totalAmount.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Notification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🆕 New Order Received!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Order Details</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-family: monospace;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Customer:</td>
                  <td style="padding: 8px 0; color: #111827;">${customerName || 'Guest'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 18px; font-weight: bold;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Items (${items.length})</h3>
              <pre style="background: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: pre-wrap;">${orderItemsList}</pre>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                View in Fulfillment Dashboard →
              </a>
            </div>

            <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
              This is an automated notification from ${tenantName} ordering system.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
🆕 New Order Received!

Order ID: ${orderId}
Customer: ${customerName || 'Guest'}
Total: $${totalAmount.toFixed(2)}

Items (${items.length}):
${orderItemsList}

View in Fulfillment Dashboard: ${dashboardUrl}

---
This is an automated notification from ${tenantName} ordering system.
      `.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[email] Order notification sent successfully via Resend', { to, orderId });
  } catch (error) {
    console.error('[email] Failed to send order notification:', error);
    throw error;
  }
}

export interface CustomerConfirmationEmailParams {
  to: string;
  orderId: string;
  customerName: string | null;
  totalAmount: number;
  subtotal: number;
  tax: number;
  items: Array<{ name: string; quantity: number; price: number; modifiers?: string[] }>;
  tenantName: string;
  tenantLogo?: string | null;
  tenantPhone?: string | null;
  tenantAddress?: string | null;
  fulfillmentMethod: 'pickup' | 'delivery';
  estimatedTime?: string | null;
  orderStatusUrl?: string;
  primaryColor?: string;
  fromAddress?: string;
  replyTo?: string;
}

export async function sendCustomerConfirmationEmail({
  to,
  orderId,
  customerName,
  totalAmount,
  subtotal,
  tax,
  items,
  tenantName,
  tenantLogo,
  tenantPhone,
  tenantAddress,
  fulfillmentMethod,
  estimatedTime,
  orderStatusUrl,
  primaryColor = '#dc2626',
  fromAddress,
  replyTo,
}: CustomerConfirmationEmailParams): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn('[email] Cannot send customer confirmation - Resend not configured');
    return;
  }

  const orderItemsHtml = items
    .map((item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 500; color: #111827;">${item.quantity}x ${item.name}</span>
          ${item.modifiers && item.modifiers.length > 0 ? `<br><span style="font-size: 12px; color: #6b7280;">${item.modifiers.join(', ')}</span>` : ''}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `)
    .join('');

  const orderItemsText = items
    .map((item) => `  • ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}${item.modifiers && item.modifiers.length > 0 ? ` (${item.modifiers.join(', ')})` : ''}`)
    .join('\n');

  const fulfillmentText = fulfillmentMethod === 'pickup' ? 'Pick Up' : 'Delivery';
  const fulfillmentIcon = fulfillmentMethod === 'pickup' ? '🏪' : '🚗';

  try {
    const { error } = await resend.emails.send({
      from: fromAddress || `${tenantName} <${DEFAULT_FROM_EMAIL}>`,
      to: [to],
      replyTo: replyTo,
      subject: `✅ Order Confirmed - ${tenantName} #${orderId.slice(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #f59e0b 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;">` : ''}
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">✅ Order Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thank you for your order, ${customerName || 'valued customer'}!</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

            <!-- Order Number -->
            <div style="text-align: center; margin-bottom: 25px; padding: 15px; background: #f9fafb; border-radius: 12px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
              <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 20px; font-weight: bold; color: #111827;">#${orderId.slice(0, 8).toUpperCase()}</p>
            </div>

            <!-- Fulfillment Info -->
            <div style="background: linear-gradient(135deg, ${primaryColor}10 0%, #f59e0b10 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid ${primaryColor}20;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${fulfillmentIcon}</span>
                <div>
                  <p style="margin: 0; font-weight: 600; color: #111827; font-size: 16px;">${fulfillmentText}</p>
                  ${estimatedTime ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Estimated: ${estimatedTime}</p>` : ''}
                </div>
              </div>
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">Your Order</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${orderItemsHtml}
              </table>
            </div>

            <!-- Order Total -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Subtotal</td>
                  <td style="padding: 5px 0; text-align: right; color: #111827;">$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Tax</td>
                  <td style="padding: 5px 0; text-align: right; color: #111827;">$${tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px 0 5px 0; font-weight: bold; color: #111827; font-size: 18px; border-top: 2px solid #e5e7eb;">Total</td>
                  <td style="padding: 15px 0 5px 0; text-align: right; font-weight: bold; color: #111827; font-size: 18px; border-top: 2px solid #e5e7eb;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            ${orderStatusUrl ? `
            <!-- Track Order Button -->
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${orderStatusUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, #f59e0b 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Track Your Order →
              </a>
            </div>
            ` : ''}

            <!-- Restaurant Info -->
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-weight: 600; color: #111827;">${tenantName}</p>
              ${tenantAddress ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${tenantAddress}</p>` : ''}
              ${tenantPhone ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">📞 ${tenantPhone}</p>` : ''}
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This is an automated confirmation from ${tenantName}.</p>
            <p>If you have questions about your order, please contact us.</p>
          </div>
        </body>
        </html>
      `,
      text: `
✅ Order Confirmed!

Thank you for your order, ${customerName || 'valued customer'}!

Order Number: #${orderId.slice(0, 8).toUpperCase()}
${fulfillmentIcon} ${fulfillmentText}${estimatedTime ? ` - Estimated: ${estimatedTime}` : ''}

Your Order:
${orderItemsText}

---
Subtotal: $${subtotal.toFixed(2)}
Tax: $${tax.toFixed(2)}
Total: $${totalAmount.toFixed(2)}

---
${tenantName}
${tenantAddress || ''}
${tenantPhone ? `Phone: ${tenantPhone}` : ''}

${orderStatusUrl ? `Track your order: ${orderStatusUrl}` : ''}

This is an automated confirmation. If you have questions, please contact us.
      `.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[email] Customer confirmation sent successfully via Resend', { to, orderId });
  } catch (error) {
    console.error('[email] Failed to send customer confirmation:', error);
    throw error;
  }
}

// Platform admin email for order notifications
const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL || 'ernesto@mvicorp.net';

// Convenience function to send all order emails after order completion
export async function sendOrderEmails(orderId: string): Promise<{ customerSent: boolean; tenantSent: boolean; platformSent: boolean }> {
  const prisma = await getPrisma();
  const result = { customerSent: false, tenantSent: false, platformSent: false };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: true,
        items: {
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!order) {
      console.error('[email] Order not found:', orderId);
      return result;
    }

    const items = order.items.map((item) => ({
      name: item.menuItem?.name || item.menuItemName || 'Item',
      quantity: item.quantity,
      price: item.price,
    }));

    // Build tenant URL dynamically from database - no hardcoded fallbacks
    const rootDomain = process.env.ROOT_DOMAIN || 'alessacloud.com';
    const baseUrl = order.tenant.customDomain
      ? `https://${order.tenant.customDomain}`
      : `https://${order.tenant.slug}.${rootDomain}`;

    // Build tenant address from components
    const tenantAddress = [
      order.tenant.addressLine1,
      order.tenant.city,
      order.tenant.state,
      order.tenant.postalCode,
    ].filter(Boolean).join(', ');

    // Get the appropriate from address and reply-to for this tenant
    const tenantForEmail = {
      name: order.tenant.name,
      emailDomainVerified: (order.tenant as { emailDomainVerified?: boolean }).emailDomainVerified,
      customDomain: order.tenant.customDomain,
      contactEmail: order.tenant.contactEmail,
    };
    const fromAddress = getTenantFromAddress(tenantForEmail);
    const replyTo = getTenantReplyTo(tenantForEmail);

    // Send to customer if email exists
    if (order.customerEmail) {
      try {
        await sendCustomerConfirmationEmail({
          to: order.customerEmail,
          orderId: order.id,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          subtotal: order.subtotalAmount || order.totalAmount - (order.taxAmount || 0),
          tax: order.taxAmount || 0,
          items,
          tenantName: order.tenant.name,
          tenantLogo: order.tenant.logoUrl,
          tenantPhone: order.tenant.contactPhone,
          tenantAddress: tenantAddress || null,
          fulfillmentMethod: order.fulfillmentMethod as 'pickup' | 'delivery',
          orderStatusUrl: `${baseUrl}/customer/orders`,
          primaryColor: order.tenant.primaryColor || '#dc2626',
          fromAddress,
          replyTo,
        });
        result.customerSent = true;
      } catch (err) {
        console.error('[email] Failed to send customer email:', err);
      }
    }

    // Send to tenant if contact email exists
    if (order.tenant.contactEmail) {
      try {
        await sendOrderNotificationEmail({
          to: order.tenant.contactEmail,
          orderId: order.id,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          items,
          tenantName: order.tenant.name,
          tenantSlug: order.tenant.slug,
          tenantCustomDomain: order.tenant.customDomain,
          fulfillmentUrl: `${baseUrl}/admin/fulfillment`,
          fromAddress,
          replyTo,
        });
        result.tenantSent = true;
      } catch (err) {
        console.error('[email] Failed to send tenant email:', err);
      }
    }

    // Send to platform admin (you) for all orders
    if (PLATFORM_ADMIN_EMAIL && PLATFORM_ADMIN_EMAIL !== order.tenant.contactEmail) {
      try {
        await sendOrderNotificationEmail({
          to: PLATFORM_ADMIN_EMAIL,
          orderId: order.id,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          items,
          tenantName: order.tenant.name,
          tenantSlug: order.tenant.slug,
          tenantCustomDomain: order.tenant.customDomain,
          fulfillmentUrl: `${baseUrl}/admin/fulfillment`,
          fromAddress,
          replyTo,
        });
        result.platformSent = true;
      } catch (err) {
        console.error('[email] Failed to send platform admin email:', err);
      }
    }

    return result;
  } catch (error) {
    console.error('[email] Failed to send order emails:', error);
    return result;
  }
}

// Export helper functions for use in domain verification
export { getTenantFromAddress, getTenantReplyTo };

// ==========================================
// Group Order Email Templates
// ==========================================

export interface GroupOrderInvitationEmailParams {
  to: string;
  recipientName: string;
  organizerName: string;
  companyName: string;
  tenantName: string;
  tenantLogo?: string | null;
  groupOrderUrl: string;
  expiresAt: Date;
  sponsorName?: string | null; // If someone is buying for the group
  primaryColor?: string;
  fromAddress?: string;
  replyTo?: string;
}

export async function sendGroupOrderInvitationEmail({
  to,
  recipientName,
  organizerName,
  companyName,
  tenantName,
  tenantLogo,
  groupOrderUrl,
  expiresAt,
  sponsorName,
  primaryColor = '#dc2626',
  fromAddress,
  replyTo,
}: GroupOrderInvitationEmailParams): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn('[email] Cannot send group order invitation - Resend not configured');
    return;
  }

  const expiresFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(expiresAt);

  const sponsorBadge = sponsorName
    ? `<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 18px;">🎉</span>
        <span style="font-weight: 600; margin-left: 8px;">${sponsorName} is buying!</span>
      </div>`
    : '';

  const sponsorText = sponsorName ? `\n🎉 ${sponsorName} is buying for the group!\n` : '';

  try {
    const { error } = await resend.emails.send({
      from: fromAddress || `${tenantName} <${DEFAULT_FROM_EMAIL}>`,
      to: [to],
      replyTo: replyTo,
      subject: `🍽️ ${organizerName} invited you to order at ${tenantName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Group Order Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #f59e0b 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;">` : ''}
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">🍽️ You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Group Order at ${tenantName}</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

            <!-- Greeting -->
            <p style="font-size: 18px; color: #111827; margin-bottom: 20px;">
              Hi ${recipientName}! 👋
            </p>

            <!-- Invitation Message -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                <strong>${organizerName}</strong> started a group order for <strong>${companyName}</strong> and invited you to add your order!
              </p>
            </div>

            ${sponsorBadge}

            <!-- Expiration Notice -->
            <div style="background: #fef3c7; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏰ <strong>Order by:</strong> ${expiresFormatted}
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${groupOrderUrl}" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, #f59e0b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                Add Your Order →
              </a>
            </div>

            <!-- Info Footer -->
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 25px;">
              Click the button above to view the menu and add your items to the group order.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This invitation was sent by ${organizerName} via ${tenantName}.</p>
            <p>If you didn't expect this email, you can safely ignore it.</p>
          </div>
        </body>
        </html>
      `,
      text: `
🍽️ You're Invited to a Group Order!

Hi ${recipientName}!

${organizerName} started a group order for ${companyName} at ${tenantName} and invited you to add your order!
${sponsorText}
⏰ Order by: ${expiresFormatted}

Add Your Order: ${groupOrderUrl}

Click the link above to view the menu and add your items to the group order.

---
This invitation was sent by ${organizerName} via ${tenantName}.
If you didn't expect this email, you can safely ignore it.
      `.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[email] Group order invitation sent successfully', { to, recipientName });
  } catch (error) {
    console.error('[email] Failed to send group order invitation:', error);
    throw error;
  }
}

export interface GroupOrderParticipantConfirmationEmailParams {
  to: string;
  participantName: string;
  companyName: string;
  tenantName: string;
  tenantLogo?: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  isSponsored: boolean;
  organizerName: string;
  primaryColor?: string;
  fromAddress?: string;
  replyTo?: string;
}

export async function sendGroupOrderParticipantConfirmationEmail({
  to,
  participantName,
  companyName,
  tenantName,
  tenantLogo,
  items,
  totalAmount,
  isSponsored,
  organizerName,
  primaryColor = '#dc2626',
  fromAddress,
  replyTo,
}: GroupOrderParticipantConfirmationEmailParams): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn('[email] Cannot send participant confirmation - Resend not configured');
    return;
  }

  const orderItemsHtml = items
    .map((item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 500; color: #111827;">${item.quantity}x ${item.name}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `)
    .join('');

  const orderItemsText = items
    .map((item) => `  • ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const paymentNote = isSponsored
    ? `<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 18px;">🎉</span>
        <span style="font-weight: 600; margin-left: 8px;">No payment needed - this order is sponsored!</span>
      </div>`
    : '';

  const paymentText = isSponsored ? '\n🎉 No payment needed - this order is sponsored!\n' : '';

  try {
    const { error } = await resend.emails.send({
      from: fromAddress || `${tenantName} <${DEFAULT_FROM_EMAIL}>`,
      to: [to],
      replyTo: replyTo,
      subject: `✅ Your order was added to ${companyName} group order`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Added to Group</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, #f59e0b 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;">` : ''}
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">✅ Order Added!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${companyName} Group Order</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

            <!-- Greeting -->
            <p style="font-size: 18px; color: #111827; margin-bottom: 20px;">
              Great choice, ${participantName}! 🎉
            </p>

            <!-- Confirmation Message -->
            <div style="background: #f0fdf4; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                Your order has been added to the group order. ${organizerName} has been notified.
              </p>
            </div>

            ${paymentNote}

            <!-- Order Items -->
            <div style="margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Your Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${orderItemsHtml}
                <tr>
                  <td style="padding: 15px 0 5px 0; font-weight: bold; color: #111827; font-size: 16px; border-top: 2px solid #e5e7eb;">Your Total</td>
                  <td style="padding: 15px 0 5px 0; text-align: right; font-weight: bold; color: #111827; font-size: 16px; border-top: 2px solid #e5e7eb;">$${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Info -->
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 25px;">
              You'll receive another confirmation when the group order is complete and ready.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This confirmation was sent via ${tenantName}.</p>
          </div>
        </body>
        </html>
      `,
      text: `
✅ Order Added to Group Order!

Great choice, ${participantName}!

Your order has been added to the ${companyName} group order. ${organizerName} has been notified.
${paymentText}
Your Items:
${orderItemsText}

Your Total: $${totalAmount.toFixed(2)}

You'll receive another confirmation when the group order is complete and ready.

---
This confirmation was sent via ${tenantName}.
      `.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[email] Participant confirmation sent successfully', { to, participantName });
  } catch (error) {
    console.error('[email] Failed to send participant confirmation:', error);
    throw error;
  }
}

export interface GroupOrderSummaryEmailParams {
  to: string;
  organizerName: string;
  companyName: string;
  tenantName: string;
  tenantLogo?: string | null;
  sessionCode: string;
  participants: Array<{
    name: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  }>;
  grandTotal: number;
  fulfillmentMethod: 'pickup' | 'delivery';
  primaryColor?: string;
  fromAddress?: string;
  replyTo?: string;
}

export async function sendGroupOrderSummaryEmail({
  to,
  organizerName,
  companyName,
  tenantName,
  tenantLogo,
  sessionCode,
  participants,
  grandTotal,
  fulfillmentMethod,
  primaryColor = '#dc2626',
  fromAddress,
  replyTo,
}: GroupOrderSummaryEmailParams): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn('[email] Cannot send group order summary - Resend not configured');
    return;
  }

  const fulfillmentText = fulfillmentMethod === 'pickup' ? 'Pick Up' : 'Delivery';
  const fulfillmentIcon = fulfillmentMethod === 'pickup' ? '🏪' : '🚗';

  const participantsHtml = participants
    .map((p) => `
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 8px;">${p.name}</div>
        ${p.items.map((item) => `
          <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; padding: 2px 0;">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        <div style="display: flex; justify-content: space-between; font-weight: 600; color: #111827; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <span>Subtotal</span>
          <span>$${p.total.toFixed(2)}</span>
        </div>
      </div>
    `)
    .join('');

  const participantsText = participants
    .map((p) => {
      const itemsText = p.items
        .map((item) => `    • ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`)
        .join('\n');
      return `${p.name}:\n${itemsText}\n  Subtotal: $${p.total.toFixed(2)}`;
    })
    .join('\n\n');

  try {
    const { error } = await resend.emails.send({
      from: fromAddress || `${tenantName} <${DEFAULT_FROM_EMAIL}>`,
      to: [to],
      replyTo: replyTo,
      subject: `🎉 Everyone ordered! ${companyName} Group Order Complete`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Group Order Complete</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;">` : ''}
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">🎉 All Orders In!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${companyName} Group Order Complete</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

            <!-- Greeting -->
            <p style="font-size: 18px; color: #111827; margin-bottom: 20px;">
              Great news, ${organizerName}! 🎊
            </p>

            <!-- Summary Header -->
            <div style="background: #f0fdf4; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                Everyone has placed their order! Here's the complete summary for ${companyName}.
              </p>
            </div>

            <!-- Order Info -->
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
              <div style="flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Order Code</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; font-family: monospace; color: #111827;">${sessionCode}</p>
              </div>
              <div style="flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Fulfillment</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #111827;">${fulfillmentIcon} ${fulfillmentText}</p>
              </div>
              <div style="flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Participants</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #111827;">${participants.length} people</p>
              </div>
            </div>

            <!-- Participants Orders -->
            <h3 style="margin: 25px 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">Order Details by Person</h3>
            ${participantsHtml}

            <!-- Grand Total -->
            <div style="background: linear-gradient(135deg, ${primaryColor}10 0%, #f59e0b10 100%); padding: 20px; border-radius: 12px; margin-top: 20px; border: 2px solid ${primaryColor}30;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px; font-weight: bold; color: #111827;">Grand Total</span>
                <span style="font-size: 24px; font-weight: bold; color: ${primaryColor};">$${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <!-- Info -->
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 25px;">
              Your group order is ready for ${fulfillmentText.toLowerCase()}!
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>This summary was sent via ${tenantName}.</p>
          </div>
        </body>
        </html>
      `,
      text: `
🎉 Everyone Ordered! Group Order Complete

Great news, ${organizerName}!

Everyone has placed their order! Here's the complete summary for ${companyName}.

Order Code: ${sessionCode}
Fulfillment: ${fulfillmentIcon} ${fulfillmentText}
Participants: ${participants.length} people

---
Order Details by Person:

${participantsText}

---
Grand Total: $${grandTotal.toFixed(2)}

Your group order is ready for ${fulfillmentText.toLowerCase()}!

---
This summary was sent via ${tenantName}.
      `.trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[email] Group order summary sent successfully', { to, organizerName, sessionCode });
  } catch (error) {
    console.error('[email] Failed to send group order summary:', error);
    throw error;
  }
}
