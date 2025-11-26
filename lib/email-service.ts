import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

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

