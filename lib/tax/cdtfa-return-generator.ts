import prisma from '@/lib/prisma';

/**
 * CDTFA BOE-401-A Return Data
 * Pre-filled fields for California Sales and Use Tax Return
 */
export interface CDTFAReturnData {
  // Business info
  permitNumber: string;
  ein: string;
  businessName: string;
  businessAddress: string;
  state: string;

  // Period
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  filingDeadline: string;
  quarterLabel: string; // "Q1 2026", "Q2 2026", etc.

  // Line items (BOE-401-A form)
  line1_grossSales: number;
  line2_purchasesSubjectToUseTax: number;
  line3_totalBeforeDeductions: number;
  line4_nontaxableSales: number;
  line5_taxableSales: number;
  line6_stateTaxDue: number; // taxableSales * state rate (7.25%)
  line7_countyTax: number;
  line8_cityTax: number;
  line9_districtTax: number;
  line10_totalTaxDue: number;
  line11_prepayments: number; // amount already escrowed
  line12_netAmountDue: number;

  // Tax rate breakdown
  stateTaxRate: number;
  districtTaxRate: number;
  totalEffectiveRate: number;

  // Source data
  posTransactionCount: number;
  onlineOrderCount: number;
  totalTransactionCount: number;
  dailySetAsideCount: number;
}

const QUARTER_LABELS: Record<number, string> = {
  1: 'Q1 (Jan-Mar)',
  2: 'Q2 (Apr-Jun)',
  3: 'Q3 (Jul-Sep)',
  4: 'Q4 (Oct-Dec)',
};

/**
 * Generate pre-filled CDTFA return data for a filing period.
 * Aggregates daily set-aside records and computes all BOE-401-A form fields.
 */
export async function generateCDTFAReturnData(
  tenantId: string,
  filingPeriodId: string
): Promise<CDTFAReturnData> {
  const period = await prisma.taxFilingPeriod.findFirst({
    where: { id: filingPeriodId, tenantId },
  });

  if (!period) {
    throw new Error('Filing period not found');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { integrations: true },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Get daily set-asides for this period
  const setAsides = await prisma.taxDailySetAside.findMany({
    where: {
      tenantId,
      date: { gte: period.periodStart, lte: period.periodEnd },
    },
    orderBy: { date: 'asc' },
  });

  // Aggregate totals
  const totalPosTax = setAsides.reduce((sum, s) => sum + s.posTaxCollected, 0);
  const totalOnlineTax = setAsides.reduce((sum, s) => sum + s.onlineTaxCollected, 0);
  const totalTaxCollected = setAsides.reduce((sum, s) => sum + s.totalTaxCollected, 0);
  const totalPosCount = setAsides.reduce((sum, s) => sum + s.posTransactionCount, 0);
  const totalOnlineCount = setAsides.reduce((sum, s) => sum + s.onlineOrderCount, 0);

  // Get tax rate from tenant integration
  const taxRate = tenant.integrations?.defaultTaxRate ?? 0.0825;
  const stateTaxRate = 0.0725; // CA base state rate
  const districtTaxRate = Math.max(0, taxRate - stateTaxRate); // local district taxes

  // Calculate gross sales from tax collected (reverse from tax)
  // grossSales = taxCollected / effectiveRate
  const grossSales = taxRate > 0
    ? Math.round((totalTaxCollected / taxRate) * 100) / 100
    : 0;

  // For restaurants, most food is taxable in CA (prepared food is taxable)
  const nontaxableSales = 0; // Can be adjusted if tenant has non-taxable items
  const taxableSales = grossSales - nontaxableSales;

  // Tax calculations
  const stateTaxDue = Math.round(taxableSales * stateTaxRate * 100) / 100;
  const districtTax = Math.round(taxableSales * districtTaxRate * 100) / 100;
  const totalTaxDue = Math.round((stateTaxDue + districtTax) * 100) / 100;

  // Escrow balance for this period
  const escrowBalance = period.totalEscrowBalance;
  const netAmountDue = Math.round((totalTaxDue - escrowBalance) * 100) / 100;

  const quarterLabel = period.quarter
    ? `${QUARTER_LABELS[period.quarter]} ${period.year}`
    : `Month ${period.month} ${period.year}`;

  const address = [
    tenant.addressLine1,
    tenant.addressLine2,
    [tenant.city, tenant.state, tenant.postalCode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(', ');

  return {
    permitNumber: tenant.integrations?.taxCdtfaAccountNumber ?? '',
    ein: tenant.integrations?.taxEin ?? '',
    businessName: tenant.name,
    businessAddress: address,
    state: period.state,

    periodStart: period.periodStart.toISOString().split('T')[0],
    periodEnd: period.periodEnd.toISOString().split('T')[0],
    filingDeadline: period.filingDeadline.toISOString().split('T')[0],
    quarterLabel,

    line1_grossSales: Math.round(grossSales * 100) / 100,
    line2_purchasesSubjectToUseTax: 0,
    line3_totalBeforeDeductions: Math.round(grossSales * 100) / 100,
    line4_nontaxableSales: nontaxableSales,
    line5_taxableSales: Math.round(taxableSales * 100) / 100,
    line6_stateTaxDue: stateTaxDue,
    line7_countyTax: 0, // Included in district tax for simplicity
    line8_cityTax: 0,
    line9_districtTax: districtTax,
    line10_totalTaxDue: totalTaxDue,
    line11_prepayments: Math.round(escrowBalance * 100) / 100,
    line12_netAmountDue: Math.max(0, netAmountDue),

    stateTaxRate,
    districtTaxRate,
    totalEffectiveRate: taxRate,

    posTransactionCount: totalPosCount,
    onlineOrderCount: totalOnlineCount,
    totalTransactionCount: totalPosCount + totalOnlineCount,
    dailySetAsideCount: setAsides.length,
  };
}

/**
 * Generate an HTML summary of the CDTFA return data.
 * Can be used directly in emails or converted to PDF.
 */
export function generateCDTFAReturnHTML(data: CDTFAReturnData): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #065f46; font-size: 24px; border-bottom: 2px solid #059669; padding-bottom: 10px; }
    h2 { color: #065f46; font-size: 18px; margin-top: 24px; }
    .header { background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .header p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .amount { text-align: right; font-family: monospace; }
    .total-row { font-weight: bold; background: #f0fdf4; }
    .due-row { font-weight: bold; background: #fef3c7; font-size: 1.1em; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
    .summary-card { background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
    .summary-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .summary-card .value { font-size: 20px; font-weight: bold; color: #065f46; }
    .note { background: #fffbeb; border: 1px solid #fbbf24; padding: 12px; border-radius: 6px; margin-top: 20px; }
    .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>California Sales & Use Tax Return</h1>
  <p style="color: #6b7280; margin-top: -8px;">CDTFA-401-A — Pre-Filled Return Data</p>

  <div class="header">
    <p><strong>Business:</strong> ${data.businessName}</p>
    <p><strong>Address:</strong> ${data.businessAddress}</p>
    <p><strong>Permit #:</strong> ${data.permitNumber || 'Not configured'}</p>
    <p><strong>EIN:</strong> ${data.ein || 'Not configured'}</p>
    <p><strong>Period:</strong> ${data.quarterLabel} (${data.periodStart} to ${data.periodEnd})</p>
    <p><strong>Filing Deadline:</strong> ${data.filingDeadline}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Total Tax Due</div>
      <div class="value">${fmt(data.line10_totalTaxDue)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Escrow Balance</div>
      <div class="value">${fmt(data.line11_prepayments)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Transactions</div>
      <div class="value">${data.totalTransactionCount.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Days Tracked</div>
      <div class="value">${data.dailySetAsideCount}</div>
    </div>
  </div>

  <h2>Return Line Items</h2>
  <table>
    <tr><th>Line</th><th>Description</th><th class="amount">Amount</th></tr>
    <tr><td>1</td><td>Gross Sales</td><td class="amount">${fmt(data.line1_grossSales)}</td></tr>
    <tr><td>2</td><td>Purchases Subject to Use Tax</td><td class="amount">${fmt(data.line2_purchasesSubjectToUseTax)}</td></tr>
    <tr><td>3</td><td>Total (Line 1 + Line 2)</td><td class="amount">${fmt(data.line3_totalBeforeDeductions)}</td></tr>
    <tr><td>4</td><td>Nontaxable Sales / Deductions</td><td class="amount">${fmt(data.line4_nontaxableSales)}</td></tr>
    <tr><td>5</td><td>Taxable Sales (Line 3 - Line 4)</td><td class="amount">${fmt(data.line5_taxableSales)}</td></tr>
    <tr class="total-row"><td>6</td><td>State Tax Due (${pct(data.stateTaxRate)})</td><td class="amount">${fmt(data.line6_stateTaxDue)}</td></tr>
    <tr><td>7</td><td>County Tax</td><td class="amount">${fmt(data.line7_countyTax)}</td></tr>
    <tr><td>8</td><td>City Tax</td><td class="amount">${fmt(data.line8_cityTax)}</td></tr>
    <tr><td>9</td><td>District Tax (${pct(data.districtTaxRate)})</td><td class="amount">${fmt(data.line9_districtTax)}</td></tr>
    <tr class="total-row"><td>10</td><td>Total Tax Due</td><td class="amount">${fmt(data.line10_totalTaxDue)}</td></tr>
    <tr><td>11</td><td>Prepayments / Escrow Balance</td><td class="amount">${fmt(data.line11_prepayments)}</td></tr>
    <tr class="due-row"><td>12</td><td>Net Amount Due</td><td class="amount">${fmt(data.line12_netAmountDue)}</td></tr>
  </table>

  <h2>Tax Rate Breakdown</h2>
  <table>
    <tr><th>Component</th><th class="amount">Rate</th></tr>
    <tr><td>California State Rate</td><td class="amount">${pct(data.stateTaxRate)}</td></tr>
    <tr><td>Local District Tax</td><td class="amount">${pct(data.districtTaxRate)}</td></tr>
    <tr class="total-row"><td>Total Effective Rate</td><td class="amount">${pct(data.totalEffectiveRate)}</td></tr>
  </table>

  <h2>Transaction Summary</h2>
  <table>
    <tr><th>Source</th><th class="amount">Count</th></tr>
    <tr><td>POS Transactions</td><td class="amount">${data.posTransactionCount.toLocaleString()}</td></tr>
    <tr><td>Online Orders</td><td class="amount">${data.onlineOrderCount.toLocaleString()}</td></tr>
    <tr class="total-row"><td>Total</td><td class="amount">${data.totalTransactionCount.toLocaleString()}</td></tr>
  </table>

  <div class="note">
    <strong>Next Steps:</strong> File this return at
    <a href="https://onlineservices.cdtfa.ca.gov/">onlineservices.cdtfa.ca.gov</a>
    before <strong>${data.filingDeadline}</strong>. After filing, mark as filed in your Alessa dashboard
    and the system will automatically initiate ACH payment.
  </div>

  <div class="footer">
    Generated by Alessa Auto Sales Tax on ${new Date().toISOString().split('T')[0]}.
    This is a pre-filled summary — verify all amounts before filing with CDTFA.
  </div>
</body>
</html>`;
}
