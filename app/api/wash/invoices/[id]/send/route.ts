import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/wash/invoices/[id]/send - Email invoice to fleet
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const body = await req.json();

    const { customEmail, message } = body;

    const invoice = await prisma.washInvoice.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        fleet: true,
        washes: {
          include: {
            truck: { select: { truckNumber: true } },
          },
          orderBy: { washedAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const recipientEmail = customEmail || invoice.fleet.email;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No email address provided or on file for fleet' },
        { status: 400 }
      );
    }

    // Generate invoice summary for email
    const formatDate = (date: Date) =>
      new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const washList = invoice.washes
      .map((w) => `• ${formatDate(w.washedAt)} - Truck ${w.truck.truckNumber} - ${formatCurrency(Number(w.price))}`)
      .join('\n');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .total { font-size: 24px; font-weight: bold; color: #10b981; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${tenant.name}</h1>
      <p style="margin: 5px 0 0;">Power Washing Services</p>
    </div>
    <div class="content">
      <h2>Invoice ${invoice.invoiceNumber}</h2>

      ${message ? `<p>${message}</p>` : ''}

      <div class="invoice-box">
        <p><strong>To:</strong> ${invoice.fleet.name}</p>
        <p><strong>Service Period:</strong> ${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}</p>

        <table style="margin-top: 20px;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Truck</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.washes.map((w) => `
              <tr>
                <td>${formatDate(w.washedAt)}</td>
                <td>${w.truck.truckNumber}</td>
                <td style="text-align: right;">${formatCurrency(Number(w.price))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Total Washes:</strong> ${invoice.washCount}</p>
          <p><strong>Subtotal:</strong> ${formatCurrency(Number(invoice.subtotal))}</p>
          ${Number(invoice.tax) > 0 ? `<p><strong>Tax:</strong> ${formatCurrency(Number(invoice.tax))}</p>` : ''}
          <p class="total">Total Due: ${formatCurrency(Number(invoice.total))}</p>
        </div>
      </div>

      ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Thank you for your business! If you have any questions about this invoice, please contact us.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${tenant.name} <invoices@alessacloud.com>`,
      to: recipientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${tenant.name}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[wash/invoices/send] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Update invoice status to 'sent'
    await prisma.washInvoice.update({
      where: { id },
      data: { status: 'sent' },
    });

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      sentTo: recipientEmail,
    });
  } catch (error) {
    console.error('[wash/invoices/[id]/send] Error:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
