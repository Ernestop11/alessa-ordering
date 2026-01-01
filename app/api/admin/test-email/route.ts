import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireTenant } from '@/lib/tenant';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper to get tenant's public URL
function getTenantUrl(tenant: { customDomain?: string | null; slug: string }): string {
  if (tenant.customDomain) {
    return `https://${tenant.customDomain}`;
  }
  const rootDomain = process.env.ROOT_DOMAIN || 'alessacloud.com';
  return `https://${tenant.slug}.${rootDomain}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    // Get current tenant dynamically - no hardcoded tenant info
    const tenant = await requireTenant();
    const tenantUrl = getTenantUrl(tenant);

    // Build tenant info from database
    const TENANT = {
      name: tenant.name,
      logoUrl: tenant.logoUrl || `${tenantUrl}/tenant/${tenant.slug}/logo.png`,
      address: tenant.addressLine1 || '',
      city: tenant.city || '',
      state: tenant.state || '',
      zip: tenant.postalCode || '',
      phone: tenant.contactPhone || '',
      email: tenant.contactEmail || `orders@${tenant.customDomain || `${tenant.slug}.alessacloud.com`}`,
      primaryColor: tenant.primaryColor || '#dc2626',
      secondaryColor: tenant.secondaryColor || '#f59e0b',
    };

    const { to, type = 'customer' } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Missing "to" email address' },
        { status: 400 }
      );
    }

    // Realistic test order data
    const testOrder = {
      id: 'LR-' + Date.now().toString(36).toUpperCase(),
      orderNumber: Math.floor(1000 + Math.random() * 9000),
      customerName: 'Maria Garcia',
      customerPhone: '(530) 555-1234',
      customerEmail: to,
      fulfillmentMethod: 'pickup',
      scheduledTime: new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      items: [
        { name: 'Carne Asada Burrito', quantity: 2, price: 12.99, subtotal: 25.98 },
        { name: 'Street Tacos (3)', quantity: 1, price: 8.99, subtotal: 8.99 },
        { name: 'Horchata (Large)', quantity: 2, price: 4.50, subtotal: 9.00 },
        { name: 'Chips & Salsa', quantity: 1, price: 3.99, subtotal: 3.99 },
      ],
      subtotal: 47.96,
      tax: 3.84,
      total: 51.80,
      paymentMethod: 'Card ending in 4242',
      createdAt: new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
    };

    const itemsHtml = testOrder.items
      .map((item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="font-weight: 500;">${item.quantity}x</span> ${item.name}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">
            $${item.subtotal.toFixed(2)}
          </td>
        </tr>
      `)
      .join('');

    const isCustomerEmail = type === 'customer';
    const subject = isCustomerEmail
      ? `Order Confirmed! #${testOrder.orderNumber} - ${TENANT.name}`
      : `New Order #${testOrder.orderNumber} - $${testOrder.total.toFixed(2)}`;

    // Determine sender email based on tenant's domain
    const senderDomain = tenant.customDomain || `${tenant.slug}.alessacloud.com`;
    const fromEmail = `${TENANT.name} <orders@${senderDomain}>`;

    const { error, data } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      replyTo: TENANT.email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">

          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, ${TENANT.primaryColor} 0%, ${TENANT.secondaryColor} 100%); padding: 30px; text-align: center;">
            <img src="${TENANT.logoUrl}" alt="${TENANT.name}" style="max-width: 120px; height: auto; margin-bottom: 15px; border-radius: 12px;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${isCustomerEmail ? 'Thank You for Your Order!' : 'New Order Received!'}</h1>
          </div>

          <!-- Order Status Banner -->
          <div style="background: ${isCustomerEmail ? '#dcfce7' : '#fef3c7'}; padding: 15px 30px; text-align: center; border-bottom: 1px solid ${isCustomerEmail ? '#86efac' : '#fcd34d'};">
            <p style="margin: 0; color: ${isCustomerEmail ? '#166534' : '#92400e'}; font-weight: 600; font-size: 16px;">
              ${isCustomerEmail ? '✅ Your order has been confirmed!' : '🔔 Action Required: Prepare this order'}
            </p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 30px;">

            <!-- Order Info -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Order Number:</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">#${testOrder.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Placed:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${testOrder.createdAt}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Customer:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${testOrder.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${testOrder.customerPhone}</td>
                </tr>
              </table>
            </div>

            <!-- Pickup Info -->
            <div style="background: linear-gradient(135deg, ${TENANT.primaryColor}15 0%, ${TENANT.secondaryColor}15 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid ${TENANT.primaryColor};">
              <h3 style="margin: 0 0 10px 0; color: ${TENANT.primaryColor}; font-size: 16px;">📍 Pickup Details</h3>
              <p style="margin: 0; color: #374151; font-weight: 600; font-size: 18px;">Ready at: ${testOrder.scheduledTime}</p>
              <p style="margin: 10px 0 0 0; color: #6b7280;">${TENANT.address}, ${TENANT.city}, ${TENANT.state} ${TENANT.zip}</p>
            </div>

            <!-- Order Items -->
            <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              ${itemsHtml}
            </table>

            <!-- Totals -->
            <div style="border-top: 2px solid #e5e7eb; padding-top: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">$${testOrder.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Tax:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">$${testOrder.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #111827; font-size: 20px; font-weight: 700;">Total:</td>
                  <td style="padding: 12px 0; color: ${TENANT.primaryColor}; font-size: 20px; font-weight: 700; text-align: right;">$${testOrder.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Payment Info -->
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #166534; font-size: 14px;">
                💳 Paid with: ${testOrder.paymentMethod}
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #1f2937; padding: 30px; text-align: center;">
            <p style="margin: 0 0 10px 0; color: white; font-weight: 600; font-size: 16px;">${TENANT.name}</p>
            <p style="margin: 0 0 5px 0; color: #9ca3af; font-size: 14px;">${TENANT.address}</p>
            <p style="margin: 0 0 15px 0; color: #9ca3af; font-size: 14px;">${TENANT.city}, ${TENANT.state} ${TENANT.zip}</p>
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
              📞 ${TENANT.phone} &nbsp;|&nbsp; ✉️ ${TENANT.email}
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Questions about your order? Just reply to this email or call us!
              </p>
            </div>
          </div>

        </body>
        </html>
      `,
      text: `
${TENANT.name}
Order Confirmation

${isCustomerEmail ? 'Thank you for your order!' : 'New order received!'}

Order #${testOrder.orderNumber}
Placed: ${testOrder.createdAt}
Customer: ${testOrder.customerName}
Phone: ${testOrder.customerPhone}

PICKUP DETAILS
Ready at: ${testOrder.scheduledTime}
Location: ${TENANT.address}, ${TENANT.city}, ${TENANT.state} ${TENANT.zip}

ORDER ITEMS
${testOrder.items.map((item) => `${item.quantity}x ${item.name} - $${item.subtotal.toFixed(2)}`).join('\n')}

Subtotal: $${testOrder.subtotal.toFixed(2)}
Tax: $${testOrder.tax.toFixed(2)}
TOTAL: $${testOrder.total.toFixed(2)}

Paid with: ${testOrder.paymentMethod}

---
${TENANT.name}
${TENANT.address}, ${TENANT.city}, ${TENANT.state} ${TENANT.zip}
Phone: ${TENANT.phone}
Email: ${TENANT.email}

Questions? Reply to this email or call us!
      `.trim(),
    });

    if (error) {
      console.error('[test-email] Resend error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send test email' },
        { status: 400 }
      );
    }

    console.log('[test-email] Test email sent successfully', { to, type, messageId: data?.id });

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `${type === 'customer' ? 'Customer confirmation' : 'Admin notification'} test email sent to ${to}`,
    });
  } catch (error) {
    console.error('[test-email] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
