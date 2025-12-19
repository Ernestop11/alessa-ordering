/**
 * Tax Check Printer
 * 
 * Generates printable check PDFs for tax remittances
 */

interface CheckData {
  checkNumber: number;
  payee: string;
  amount: number;
  memo?: string | null;
  tenantName: string;
  tenantAddress: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  date: Date;
}

export async function generateCheckPDF(data: CheckData): Promise<Buffer> {
  // TODO: Implement check PDF generation
  // This should generate a properly formatted check that can be printed
  
  const formatCurrency = (amount: number): string => {
    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    const dollarsText = dollars.toLocaleString('en-US');
    const centsText = cents.toString().padStart(2, '0');
    return `${dollarsText}.${centsText}`;
  };

  const formatAmountInWords = (amount: number): string => {
    // Simple number to words converter (should be more robust in production)
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    let dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    
    if (dollars === 0) {
      return `Zero dollars and ${cents}/100`;
    }
    
    // Simplified conversion (should handle larger numbers in production)
    let words = '';
    if (dollars >= 1000) {
      const thousands = Math.floor(dollars / 1000);
      words += ones[thousands] + ' Thousand ';
      dollars %= 1000;
    }
    if (dollars >= 100) {
      const hundreds = Math.floor(dollars / 100);
      words += ones[hundreds] + ' Hundred ';
      dollars %= 100;
    }
    if (dollars >= 20) {
      const tensDigit = Math.floor(dollars / 10);
      words += tens[tensDigit] + ' ';
      dollars %= 10;
    } else if (dollars >= 10) {
      words += teens[dollars - 10] + ' ';
      dollars = 0;
    }
    if (dollars > 0) {
      words += ones[dollars] + ' ';
    }
    
    words += 'dollars';
    words += ` and ${cents}/100`;
    
    return words;
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Check #${data.checkNumber}</title>
        <style>
          @page {
            size: 8.5in 3.5in;
            margin: 0.5in;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 20px;
          }
          .check-container {
            border: 2px solid #000;
            padding: 20px;
            height: 2.5in;
            position: relative;
          }
          .check-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .check-date {
            font-weight: bold;
          }
          .check-number {
            font-weight: bold;
          }
          .payee-line {
            margin-bottom: 10px;
          }
          .amount-line {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .amount-words {
            flex: 1;
            margin-right: 20px;
          }
          .amount-numbers {
            font-weight: bold;
            font-size: 14px;
          }
          .memo-line {
            margin-top: 10px;
            font-style: italic;
          }
          .signature-line {
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="check-container">
          <div class="check-header">
            <div>
              <div><strong>${data.tenantName}</strong></div>
              ${data.tenantAddress.line1 ? `<div>${data.tenantAddress.line1}</div>` : ''}
              ${data.tenantAddress.line2 ? `<div>${data.tenantAddress.line2}</div>` : ''}
              ${data.tenantAddress.city && data.tenantAddress.state && data.tenantAddress.zip
                ? `<div>${data.tenantAddress.city}, ${data.tenantAddress.state} ${data.tenantAddress.zip}</div>`
                : ''}
            </div>
            <div class="check-number">#${data.checkNumber}</div>
          </div>
          
          <div class="check-date">Date: ${data.date.toLocaleDateString()}</div>
          
          <div class="payee-line">
            Pay to the order of: <strong>${data.payee}</strong>
          </div>
          
          <div class="amount-line">
            <div class="amount-words">${formatAmountInWords(data.amount)}</div>
            <div class="amount-numbers">$${formatCurrency(data.amount)}</div>
          </div>
          
          ${data.memo ? `<div class="memo-line">Memo: ${data.memo}</div>` : ''}
          
          <div class="signature-line">
            Authorized Signature: ___________________________
          </div>
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
    const pdf = await page.pdf({ 
      width: '8.5in', 
      height: '3.5in',
      printBackground: true,
    });
    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error('[check-printer] Puppeteer error:', error);
    // Fallback: return HTML as buffer if Puppeteer fails
    return Buffer.from(html, 'utf-8');
  }
}

