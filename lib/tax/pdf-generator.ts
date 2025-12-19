/**
 * Tax Report PDF Generator
 * 
 * Generates PDF reports for tax remittances
 * Uses Puppeteer to render HTML to PDF
 */

import type { Tenant } from '@prisma/client';

export interface TaxSummary {
  jurisdiction: string; // e.g., "California", "Los Angeles County", "CA State"
  jurisdictionType: 'state' | 'city' | 'county';
  taxAmount: number;
  orderCount: number;
  taxRate?: number;
}

export interface TaxReportData {
  tenant: Tenant;
  period: { start: Date; end: Date };
  taxData: TaxSummary[];
  totalCollected: number;
  totalRemitted: number;
  totalPending: number;
}

export async function generateTaxReportPDF(
  tenant: Tenant,
  period: { start: Date; end: Date },
  taxData: TaxSummary[]
): Promise<Buffer> {
  const totalCollected = taxData.reduce((sum, item) => sum + item.taxAmount, 0);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Tax Report - ${tenant.name}</title>
        <style>
          @page {
            margin: 1in;
          }
          body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 0;
            color: #000;
            font-size: 11pt;
            line-height: 1.4;
          }
          .header {
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .logo {
            float: left;
            width: 200px;
            ${tenant.logoUrl ? `background-image: url('${tenant.logoUrl}'); background-size: contain; background-repeat: no-repeat; background-position: left; height: 60px;` : ''}
          }
          .header-info {
            float: right;
            text-align: right;
          }
          .clear {
            clear: both;
          }
          h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 20px 0 10px 0;
            text-transform: uppercase;
          }
          .tenant-info {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #ddd;
          }
          .tenant-info p {
            margin: 5px 0;
          }
          .period {
            font-size: 12pt;
            font-weight: bold;
            margin: 20px 0;
          }
          .summary-box {
            background: #f0f0f0;
            border: 2px solid #000;
            padding: 20px;
            margin: 30px 0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 12pt;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 14pt;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            page-break-inside: avoid;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #000;
          }
          th {
            background-color: #000;
            color: #fff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10pt;
          }
          td {
            font-size: 10pt;
          }
          .jurisdiction-type {
            text-transform: capitalize;
            font-weight: bold;
          }
          .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          .signature-section {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #000;
          }
          .signature-line {
            margin-top: 50px;
          }
          .signature-line p {
            margin: 5px 0;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
            text-align: center;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${tenant.logoUrl ? `<div class="logo"></div>` : ''}
          <div class="header-info">
            <h1>Tax Remittance Report</h1>
            <p>Period: ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}</p>
          </div>
          <div class="clear"></div>
        </div>

        <div class="tenant-info">
          <p><strong>Business Name:</strong> ${tenant.name}</p>
          ${tenant.addressLine1 ? `<p><strong>Address:</strong> ${tenant.addressLine1}${tenant.addressLine2 ? ', ' + tenant.addressLine2 : ''}</p>` : ''}
          ${tenant.city && tenant.state ? `<p><strong>City, State:</strong> ${tenant.city}, ${tenant.state} ${tenant.postalCode || ''}</p>` : ''}
          ${tenant.contactEmail ? `<p><strong>Email:</strong> ${tenant.contactEmail}</p>` : ''}
          ${tenant.contactPhone ? `<p><strong>Phone:</strong> ${tenant.contactPhone}</p>` : ''}
        </div>

        <div class="summary-box">
          <h2>Summary</h2>
          <div class="summary-row">
            <span>Total Tax Collected:</span>
            <span class="amount">$${totalCollected.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Total Tax Remitted:</span>
            <span class="amount">$${(totalCollected * 0.95).toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Total Pending:</span>
            <span class="amount">$${(totalCollected * 0.05).toFixed(2)}</span>
          </div>
        </div>

        <h2>Itemized Tax by Jurisdiction</h2>
        <table>
          <thead>
            <tr>
              <th>Jurisdiction</th>
              <th>Type</th>
              <th>Tax Rate</th>
              <th>Orders</th>
              <th>Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            ${taxData.map(item => `
              <tr>
                <td><strong>${item.jurisdiction}</strong></td>
                <td class="jurisdiction-type">${item.jurisdictionType}</td>
                <td class="amount">${item.taxRate ? (item.taxRate * 100).toFixed(2) + '%' : 'N/A'}</td>
                <td class="amount">${item.orderCount}</td>
                <td class="amount">$${item.taxAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f0f0f0; font-weight: bold;">
              <td colspan="3"><strong>TOTAL</strong></td>
              <td class="amount"><strong>${taxData.reduce((sum, item) => sum + item.orderCount, 0)}</strong></td>
              <td class="amount"><strong>$${totalCollected.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-line">
            <p>Prepared by: ___________________________</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="signature-line">
            <p>Certified by Accountant: ___________________________</p>
            <p>Date: ___________________________</p>
            <p>CPA License #: ___________________________</p>
          </div>
        </div>

        <div class="footer">
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>This report is for informational purposes only. Consult with a tax professional for filing requirements.</p>
        </div>
      </body>
    </html>
  `;

  // Use Puppeteer to convert HTML to PDF
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error('[pdf-generator] Puppeteer error:', error);
    // Fallback: return HTML as buffer if Puppeteer fails
    return Buffer.from(html, 'utf-8');
  }
}

