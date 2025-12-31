import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    const { to, tenantName = 'Las Reinas' } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" email address' },
        { status: 400 }
      );
    }

    // Test order data
    const testOrder = {
      id: 'TEST-' + Date.now().toString(36).toUpperCase(),
      customerName: 'Test Customer',
      totalAmount: 25.99,
      items: [
        { name: 'Breakfast Burrito', quantity: 2, price: 9.99 },
        { name: 'Horchata', quantity: 1, price: 3.50 },
      ],
    };

    const orderItemsList = testOrder.items
      .map((item) => `  • ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}`)
      .join('\n');

    const { error, data } = await resend.emails.send({
      from: `${tenantName} <orders@lasreinascolusa.com>`,
      to: [to],
      replyTo: 'admin@lasreinascolusa.com',
      subject: `🧪 TEST: New Order #${testOrder.id} - $${testOrder.totalAmount.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Order Notification</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🧪 TEST EMAIL</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">This is a test of the order notification system</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Order Details</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-family: monospace;">${testOrder.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Customer:</td>
                  <td style="padding: 8px 0; color: #111827;">${testOrder.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Total:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 18px; font-weight: bold;">$${testOrder.totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Items (${testOrder.items.length})</h3>
              <pre style="background: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: pre-wrap;">${orderItemsList}</pre>
            </div>

            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #166534; font-weight: 600;">
                ✅ Email system is working correctly!
              </p>
              <p style="margin: 10px 0 0 0; color: #166534; font-size: 14px;">
                Sent from: orders@lasreinascolusa.com
              </p>
            </div>

            <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
              This is a test notification from ${tenantName} ordering system.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
🧪 TEST EMAIL - Order Notification System

Order ID: ${testOrder.id}
Customer: ${testOrder.customerName}
Total: $${testOrder.totalAmount.toFixed(2)}

Items (${testOrder.items.length}):
${orderItemsList}

✅ Email system is working correctly!
Sent from: orders@lasreinascolusa.com

---
This is a test notification from ${tenantName} ordering system.
      `.trim(),
    });

    if (error) {
      console.error('[test-email] Resend error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send test email' },
        { status: 400 }
      );
    }

    console.log('[test-email] Test email sent successfully', { to, messageId: data?.id });

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Test email sent to ${to}`,
    });
  } catch (error) {
    console.error('[test-email] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
