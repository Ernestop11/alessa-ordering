import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/invoices/[id]/pdf - Generate PDF invoice
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const invoice = await prisma.washInvoice.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        fleet: true,
        washes: {
          include: {
            truck: { select: { truckNumber: true } },
            employee: { select: { name: true } },
          },
          orderBy: { washedAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice, tenant);

    // Use Puppeteer to generate PDF
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
    } catch {
      // Fallback - return HTML if Puppeteer not available
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[wash/invoices/[id]/pdf] Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: any, tenant: any): string {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const washRows = invoice.washes
    .map(
      (w: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(w.washedAt)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${w.truck.truckNumber}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${w.employee.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(Number(w.price))}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #10b981;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-number {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-weight: bold;
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
    }
    th:last-child {
      text-align: right;
    }
    .totals {
      margin-top: 30px;
      text-align: right;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      gap: 40px;
      padding: 8px 0;
    }
    .total-row.grand {
      font-size: 18px;
      font-weight: bold;
      border-top: 2px solid #10b981;
      padding-top: 12px;
      margin-top: 8px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .footer {
      margin-top: 60px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${tenant.name}</div>
      <div style="color: #6b7280; font-size: 14px;">Power Washing Services</div>
    </div>
    <div class="invoice-title">
      <div class="invoice-number">INVOICE</div>
      <div style="color: #6b7280;">${invoice.invoiceNumber}</div>
      <div class="status-badge status-${invoice.status}">${invoice.status}</div>
    </div>
  </div>

  <div class="info-grid section">
    <div>
      <div class="section-title">Bill To</div>
      <div style="font-weight: 600;">${invoice.fleet.name}</div>
      ${invoice.fleet.contactName ? `<div>${invoice.fleet.contactName}</div>` : ''}
      ${invoice.fleet.address ? `<div>${invoice.fleet.address}</div>` : ''}
      ${invoice.fleet.email ? `<div>${invoice.fleet.email}</div>` : ''}
      ${invoice.fleet.phone ? `<div>${invoice.fleet.phone}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div class="section-title">Invoice Details</div>
      <div><strong>Invoice Date:</strong> ${formatDate(invoice.createdAt)}</div>
      <div><strong>Service Period:</strong> ${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}</div>
      ${invoice.dueDate ? `<div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Services Rendered</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Truck</th>
          <th>Technician</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${washRows}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">
      <span>Total Washes:</span>
      <span>${invoice.washCount}</span>
    </div>
    <div class="total-row">
      <span>Rate per Wash:</span>
      <span>${formatCurrency(Number(invoice.pricePerWash))}</span>
    </div>
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(Number(invoice.subtotal))}</span>
    </div>
    ${
      Number(invoice.tax) > 0
        ? `
    <div class="total-row">
      <span>Tax:</span>
      <span>${formatCurrency(Number(invoice.tax))}</span>
    </div>
    `
        : ''
    }
    <div class="total-row grand">
      <span>Total Due:</span>
      <span>${formatCurrency(Number(invoice.total))}</span>
    </div>
  </div>

  ${invoice.notes ? `<div class="section"><div class="section-title">Notes</div><div>${invoice.notes}</div></div>` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>${tenant.name} | ${tenant.contactEmail || ''} | ${tenant.contactPhone || ''}</p>
  </div>
</body>
</html>
  `;
}
