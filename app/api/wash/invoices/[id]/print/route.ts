import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// POST /api/wash/invoices/[id]/print - Generate ESC/POS commands for receipt printer
export async function POST(
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
          },
          orderBy: { washedAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate receipt text (formatted for 80mm thermal printer)
    const receipt = generateReceipt(invoice, tenant);

    // Return receipt data - client will handle actual printing
    return NextResponse.json({
      success: true,
      receipt: {
        text: receipt.text,
        commands: receipt.commands,
      },
    });
  } catch (error) {
    console.error('[wash/invoices/[id]/print] Error:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}

function generateReceipt(invoice: any, tenant: any) {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const LINE_WIDTH = 48;
  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const rightAlign = (left: string, right: string) => {
    const spaces = Math.max(1, LINE_WIDTH - left.length - right.length);
    return left + ' '.repeat(spaces) + right;
  };

  const divider = '='.repeat(LINE_WIDTH);
  const thinDivider = '-'.repeat(LINE_WIDTH);

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(center(tenant.name.toUpperCase()));
  lines.push(center('POWER WASHING SERVICES'));
  lines.push('');
  lines.push(divider);
  lines.push('');

  // Invoice info
  lines.push(center('INVOICE'));
  lines.push(center(invoice.invoiceNumber));
  lines.push('');
  lines.push(`Date: ${formatDate(invoice.createdAt)}`);
  lines.push('');

  // Customer
  lines.push('BILL TO:');
  lines.push(invoice.fleet.name);
  if (invoice.fleet.contactName) lines.push(invoice.fleet.contactName);
  lines.push('');

  // Period
  lines.push(`Period: ${formatDate(invoice.periodStart)}`);
  lines.push(`     to ${formatDate(invoice.periodEnd)}`);
  lines.push('');
  lines.push(thinDivider);

  // Washes
  lines.push('');
  lines.push('SERVICES:');
  lines.push('');

  invoice.washes.forEach((w: any) => {
    const dateStr = formatDate(w.washedAt);
    const priceStr = formatCurrency(Number(w.price));
    lines.push(rightAlign(`${dateStr} - ${w.truck.truckNumber}`, priceStr));
  });

  lines.push('');
  lines.push(thinDivider);

  // Totals
  lines.push('');
  lines.push(rightAlign('Total Washes:', String(invoice.washCount)));
  lines.push(rightAlign('Rate per Wash:', formatCurrency(Number(invoice.pricePerWash))));
  lines.push('');
  lines.push(rightAlign('Subtotal:', formatCurrency(Number(invoice.subtotal))));

  if (Number(invoice.tax) > 0) {
    lines.push(rightAlign('Tax:', formatCurrency(Number(invoice.tax))));
  }

  lines.push(divider);
  lines.push(rightAlign('TOTAL DUE:', formatCurrency(Number(invoice.total))));
  lines.push(divider);

  // Due date
  if (invoice.dueDate) {
    lines.push('');
    lines.push(`Due Date: ${formatDate(invoice.dueDate)}`);
  }

  // Footer
  lines.push('');
  lines.push('');
  lines.push(center('Thank you for your business!'));
  lines.push('');
  lines.push('');
  lines.push('');

  const text = lines.join('\n');

  // Generate ESC/POS commands
  const commands = generateEscPosCommands(lines);

  return { text, commands };
}

function generateEscPosCommands(lines: string[]): number[] {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const commands: number[] = [];

  // Initialize printer
  commands.push(ESC, 0x40); // ESC @ - Initialize

  // Set character encoding
  commands.push(ESC, 0x74, 0x00); // ESC t 0 - PC437 character set

  lines.forEach((line) => {
    // Add text
    for (let i = 0; i < line.length; i++) {
      commands.push(line.charCodeAt(i));
    }
    commands.push(LF); // Line feed
  });

  // Cut paper
  commands.push(GS, 0x56, 0x41, 0x03); // GS V A 3 - Partial cut

  return commands;
}
