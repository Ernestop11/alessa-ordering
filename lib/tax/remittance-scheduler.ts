/**
 * Tax Remittance Scheduler
 * 
 * Automatically collects tax from orders and schedules remittance to tax authorities.
 * Supports monthly and quarterly remittance schedules.
 */

import prisma from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import type Stripe from 'stripe';

export interface TaxRemittancePeriod {
  start: Date;
  end: Date;
  periodType: 'monthly' | 'quarterly';
}

export interface TaxRemittanceSummary {
  tenantId: string;
  tenantName: string;
  period: TaxRemittancePeriod;
  totalTaxCollected: number;
  orderCount: number;
  breakdown: {
    state: string;
    taxAmount: number;
    orderCount: number;
  }[];
}

/**
 * Calculate remittance period based on schedule
 */
export function getRemittancePeriod(
  schedule: 'monthly' | 'quarterly',
  referenceDate: Date = new Date()
): TaxRemittancePeriod {
  const now = new Date(referenceDate);
  
  if (schedule === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, periodType: 'monthly' };
  } else {
    // Quarterly: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
    return { start, end, periodType: 'quarterly' };
  }
}

/**
 * Get previous remittance period
 */
export function getPreviousRemittancePeriod(
  schedule: 'monthly' | 'quarterly',
  referenceDate: Date = new Date()
): TaxRemittancePeriod {
  const now = new Date(referenceDate);
  
  if (schedule === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end, periodType: 'monthly' };
  } else {
    const quarter = Math.floor(now.getMonth() / 3);
    const prevQuarter = quarter === 0 ? 3 : quarter - 1;
    const prevQuarterYear = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const start = new Date(prevQuarterYear, prevQuarter * 3, 1);
    const end = new Date(prevQuarterYear, (prevQuarter + 1) * 3, 0, 23, 59, 59, 999);
    return { start, end, periodType: 'quarterly' };
  }
}

/**
 * Calculate tax collected for a tenant in a period
 */
export async function calculateTaxCollected(
  tenantId: string,
  period: TaxRemittancePeriod
): Promise<TaxRemittanceSummary> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  // Get all orders in the period with tax amounts
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
      status: {
        in: ['confirmed', 'fulfilled', 'completed'],
      },
      taxAmount: {
        gt: 0,
      },
    },
    select: {
      id: true,
      taxAmount: true,
      totalAmount: true,
      deliveryAddress: true,
      createdAt: true,
    },
  });

  const totalTaxCollected = orders.reduce((sum, order) => sum + (order.taxAmount || 0), 0);

  // Group by state for breakdown
  const stateBreakdown = new Map<string, { taxAmount: number; orderCount: number }>();
  
  orders.forEach((order) => {
    let state = 'Unknown';
    if (order.deliveryAddress && typeof order.deliveryAddress === 'object') {
      const addr = order.deliveryAddress as any;
      state = addr.state || addr.region || 'Unknown';
    }

    const existing = stateBreakdown.get(state) || { taxAmount: 0, orderCount: 0 };
    stateBreakdown.set(state, {
      taxAmount: existing.taxAmount + (order.taxAmount || 0),
      orderCount: existing.orderCount + 1,
    });
  });

  return {
    tenantId,
    tenantName: tenant.name,
    period,
    totalTaxCollected,
    orderCount: orders.length,
    breakdown: Array.from(stateBreakdown.entries()).map(([state, data]) => ({
      state,
      ...data,
    })),
  };
}

/**
 * Create tax remittance record
 */
export async function createTaxRemittance(
  tenantId: string,
  summary: TaxRemittanceSummary
): Promise<string> {
  const remittance = await prisma.taxRemittance.create({
    data: {
      tenantId,
      periodStart: summary.period.start,
      periodEnd: summary.period.end,
      totalTaxCollected: summary.totalTaxCollected,
      status: 'pending',
      reportData: {
        orderCount: summary.orderCount,
        breakdown: summary.breakdown,
        periodType: summary.period.periodType,
      } as any,
    },
  });

  return remittance.id;
}

/**
 * Process tax remittance (transfer funds to tax authority)
 */
export async function processTaxRemittance(
  remittanceId: string,
  method: 'automatic' | 'manual' = 'automatic'
): Promise<{ success: boolean; reference?: string; error?: string }> {
  const remittance = await prisma.taxRemittance.findUnique({
    where: { id: remittanceId },
    include: {
      tenant: {
        include: {
          integrations: true,
        },
      },
    },
  });

  if (!remittance) {
    return { success: false, error: 'Remittance not found' };
  }

  if (remittance.status === 'completed') {
    return { success: false, error: 'Remittance already processed' };
  }

  const integration = remittance.tenant.integrations;
  const escrowAccountId = integration?.taxEscrowAccountId;

  if (!escrowAccountId) {
    // If no escrow account, mark as manual remittance required
    await prisma.taxRemittance.update({
      where: { id: remittanceId },
      data: {
        status: 'pending',
        remittanceMethod: 'manual',
        notes: 'No escrow account configured. Manual remittance required.',
      },
    });
    return { success: false, error: 'No tax escrow account configured. Manual remittance required.' };
  }

  try {
    // Update status to processing
    await prisma.taxRemittance.update({
      where: { id: remittanceId },
      data: {
        status: 'processing',
        remittanceMethod: method,
      },
    });

    // In a real implementation, you would:
    // 1. Transfer funds from escrow account to tax authority
    // 2. Generate tax report
    // 3. Submit report to tax authority (via Avalara, TaxJar, or direct filing)
    
    // For now, we'll simulate the process
    const stripe = getStripeClient();
    const amountCents = Math.round(remittance.totalTaxCollected * 100);

    // Create transfer to tax authority (this would be configured per jurisdiction)
    // Note: This is a placeholder - actual implementation depends on tax authority requirements
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: escrowAccountId, // In reality, this would be tax authority account
      metadata: {
        type: 'tax_remittance',
        remittanceId,
        tenantId: remittance.tenantId,
        periodStart: remittance.periodStart.toISOString(),
        periodEnd: remittance.periodEnd.toISOString(),
      },
    }, {
      stripeAccount: escrowAccountId,
    });

    // Mark as completed
    await prisma.taxRemittance.update({
      where: { id: remittanceId },
      data: {
        status: 'completed',
        totalTaxRemitted: remittance.totalTaxCollected,
        remittanceDate: new Date(),
        remittanceReference: transfer.id,
        remittanceMethod: method,
      },
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: remittance.tenantId,
        source: 'tax_remittance',
        message: `Tax remittance processed: $${remittance.totalTaxCollected.toFixed(2)}`,
        payload: {
          remittanceId,
          amount: remittance.totalTaxCollected,
          transferId: transfer.id,
          method,
        },
      },
    });

    return { success: true, reference: transfer.id };
  } catch (error) {
    console.error('[Tax Remittance] Processing failed:', error);
    
    await prisma.taxRemittance.update({
      where: { id: remittanceId },
      data: {
        status: 'failed',
        notes: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process remittance',
    };
  }
}

/**
 * Generate tax remittance report
 */
export async function generateTaxRemittanceReport(
  remittanceId: string
): Promise<{
  remittance: any;
  summary: TaxRemittanceSummary;
  report: string; // CSV or formatted text
}> {
  const remittance = await prisma.taxRemittance.findUnique({
    where: { id: remittanceId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          addressLine1: true,
          city: true,
          state: true,
          postalCode: true,
        },
      },
    },
  });

  if (!remittance) {
    throw new Error('Remittance not found');
  }

  const period: TaxRemittancePeriod = {
    start: remittance.periodStart,
    end: remittance.periodEnd,
    periodType: remittance.reportData && typeof remittance.reportData === 'object'
      ? (remittance.reportData as any).periodType || 'monthly'
      : 'monthly',
  };

  const summary = await calculateTaxCollected(remittance.tenantId, period);

  // Generate CSV report
  const csvLines = [
    'Tax Remittance Report',
    `Tenant: ${remittance.tenant.name}`,
    `Period: ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`,
    `Total Tax Collected: $${remittance.totalTaxCollected.toFixed(2)}`,
    '',
    'State Breakdown:',
    'State,Tax Amount,Order Count',
    ...summary.breakdown.map((b) => `${b.state},$${b.taxAmount.toFixed(2)},${b.orderCount}`),
  ];

  return {
    remittance,
    summary,
    report: csvLines.join('\n'),
  };
}

/**
 * Schedule automatic tax remittance for all tenants
 */
export async function scheduleAutomaticTaxRemittances(): Promise<{
  processed: number;
  errors: string[];
}> {
  const tenants = await prisma.tenant.findMany({
    where: {
      integrations: {
        taxRemittanceEnabled: true,
      },
    },
    include: {
      integrations: true,
    },
  });

  const errors: string[] = [];
  let processed = 0;

  for (const tenant of tenants) {
    try {
      const integration = tenant.integrations;
      if (!integration?.taxRemittanceEnabled) continue;

      const schedule = (integration.taxRemittanceSchedule || 'monthly') as 'monthly' | 'quarterly';
      const period = getPreviousRemittancePeriod(schedule);

      // Check if remittance already exists for this period
      const existing = await prisma.taxRemittance.findFirst({
        where: {
          tenantId: tenant.id,
          periodStart: period.start,
          periodEnd: period.end,
        },
      });

      if (existing) {
        console.log(`[Tax Remittance] Already exists for ${tenant.name} - ${period.start.toISOString()}`);
        continue;
      }

      // Calculate tax collected
      const summary = await calculateTaxCollected(tenant.id, period);

      if (summary.totalTaxCollected <= 0) {
        console.log(`[Tax Remittance] No tax collected for ${tenant.name} in period`);
        continue;
      }

      // Create remittance record
      const remittanceId = await createTaxRemittance(tenant.id, summary);

      // Process remittance
      const result = await processTaxRemittance(remittanceId, 'automatic');

      if (result.success) {
        processed++;
        console.log(`[Tax Remittance] Processed for ${tenant.name}: $${summary.totalTaxCollected.toFixed(2)}`);
      } else {
        errors.push(`${tenant.name}: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${tenant.name}: ${errorMsg}`);
      console.error(`[Tax Remittance] Error for ${tenant.name}:`, error);
    }
  }

  return { processed, errors };
}





