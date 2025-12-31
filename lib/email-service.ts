import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

// Lazy load Prisma to avoid circular dependencies
let prismaClient: typeof import('@prisma/client').PrismaClient.prototype | null = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('./prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  if (!smtpUser || !smtpPass) {
    console.warn('[email] SMTP not configured (SMTP_USER or SMTP_PASS not set), email notifications will be skipped');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export interface OrderNotificationEmailParams {
  to: string;
  orderId: string;
  customerName: string | null;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  tenantName: string;
  fulfillmentUrl?: string;
}

export async function sendOrderNotificationEmail({
  to,
  orderId,
  customerName,
  totalAmount,
  items,
  tenantName,
  fulfillmentUrl,
}: OrderNotificationEmailParams): Promise<void> {
  const emailTransporter = getTransporter();
  
  if (!emailTransporter) {
    console.warn('[email] Cannot send order notification - SMTP not configured');
    return;
  }

  const orderItemsList = items
    .map((item) => `  • ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
    .join('\n');

  const dashboardUrl = fulfillmentUrl || `${process.env.NEXTAUTH_URL || 'https://lasreinas.alessacloud.com'}/admin/fulfillment`;

  try {
    await emailTransporter.sendMail({
      from: `"${tenantName} Orders" <${process.env.SMTP_USER}>`,
      to,
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

    console.log('[email] Order notification sent successfully', { to, orderId });
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
}: CustomerConfirmationEmailParams): Promise<void> {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    console.warn('[email] Cannot send customer confirmation - SMTP not configured');
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
    await emailTransporter.sendMail({
      from: `"${tenantName}" <${process.env.SMTP_USER}>`,
      to,
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

    console.log('[email] Customer confirmation sent successfully', { to, orderId });
  } catch (error) {
    console.error('[email] Failed to send customer confirmation:', error);
    throw error;
  }
}

// Convenience function to send both emails after order completion
export async function sendOrderEmails(orderId: string): Promise<{ customerSent: boolean; tenantSent: boolean }> {
  const prisma = await getPrisma();
  const result = { customerSent: false, tenantSent: false };

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

    const baseUrl = process.env.NEXTAUTH_URL || 'https://lasreinascolusa.com';

    // Build tenant address from components
    const tenantAddress = [
      order.tenant.addressLine1,
      order.tenant.city,
      order.tenant.state,
      order.tenant.postalCode,
    ].filter(Boolean).join(', ');

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
          fulfillmentUrl: `${baseUrl}/admin/fulfillment`,
        });
        result.tenantSent = true;
      } catch (err) {
        console.error('[email] Failed to send tenant email:', err);
      }
    }

    return result;
  } catch (error) {
    console.error('[email] Failed to send order emails:', error);
    return result;
  }
}

