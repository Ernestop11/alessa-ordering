import prisma from '@/lib/prisma';

interface DailyTaxData {
  posTransactionCount: number;
  posTaxCollected: number;
  onlineOrderCount: number;
  onlineTaxCollected: number;
  totalTaxCollected: number;
  details: {
    posTransactionIds: string[];
    onlineOrderIds: string[];
  };
}

/**
 * Calculate total tax collected for a tenant on a given date.
 * Sums tax from both POS transactions and online orders.
 */
export async function calculateDailyTaxCollected(
  tenantId: string,
  date: Date
): Promise<DailyTaxData> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);

  // POS transactions (non-refunded)
  const posTransactions = await prisma.pOSTransaction.findMany({
    where: {
      tenantId,
      createdAt: { gte: dayStart, lt: dayEnd },
      refunded: false,
    },
    select: { id: true, taxAmount: true },
  });

  const posTaxCollected = posTransactions.reduce((sum, t) => sum + t.taxAmount, 0);

  // Online orders (confirmed, fulfilled, or completed — not cancelled/refunded)
  const onlineOrders = await prisma.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: dayStart, lt: dayEnd },
      status: { in: ['confirmed', 'fulfilled', 'completed', 'ready'] },
    },
    select: { id: true, taxAmount: true },
  });

  const onlineTaxCollected = onlineOrders.reduce((sum, o) => sum + (o.taxAmount ?? 0), 0);

  return {
    posTransactionCount: posTransactions.length,
    posTaxCollected: Math.round(posTaxCollected * 100) / 100,
    onlineOrderCount: onlineOrders.length,
    onlineTaxCollected: Math.round(onlineTaxCollected * 100) / 100,
    totalTaxCollected: Math.round((posTaxCollected + onlineTaxCollected) * 100) / 100,
    details: {
      posTransactionIds: posTransactions.map((t) => t.id),
      onlineOrderIds: onlineOrders.map((o) => o.id),
    },
  };
}

/**
 * Record a daily tax set-aside and create an escrow ledger entry.
 * Idempotent: if a record already exists for the tenant+date, it updates it.
 */
export async function recordDailySetAside(
  tenantId: string,
  date: Date
): Promise<{ setAside: any; ledgerEntry: any | null }> {
  const data = await calculateDailyTaxCollected(tenantId, date);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  // Upsert the daily set-aside record
  const setAside = await prisma.taxDailySetAside.upsert({
    where: {
      tenantId_date: { tenantId, date: dateOnly },
    },
    create: {
      tenantId,
      date: dateOnly,
      posTransactionCount: data.posTransactionCount,
      posTaxCollected: data.posTaxCollected,
      onlineOrderCount: data.onlineOrderCount,
      onlineTaxCollected: data.onlineTaxCollected,
      totalTaxCollected: data.totalTaxCollected,
      escrowTransferStatus: data.totalTaxCollected > 0 ? 'transferred' : 'skipped',
      transferredAt: data.totalTaxCollected > 0 ? new Date() : null,
      calculationDetails: data.details as any,
    },
    update: {
      posTransactionCount: data.posTransactionCount,
      posTaxCollected: data.posTaxCollected,
      onlineOrderCount: data.onlineOrderCount,
      onlineTaxCollected: data.onlineTaxCollected,
      totalTaxCollected: data.totalTaxCollected,
      escrowTransferStatus: data.totalTaxCollected > 0 ? 'transferred' : 'skipped',
      transferredAt: data.totalTaxCollected > 0 ? new Date() : null,
      calculationDetails: data.details as any,
    },
  });

  // Create escrow ledger entry (only if tax was collected)
  let ledgerEntry = null;
  if (data.totalTaxCollected > 0) {
    const currentBalance = await getEscrowBalance(tenantId);
    const newBalance = Math.round((currentBalance + data.totalTaxCollected) * 100) / 100;

    ledgerEntry = await prisma.taxEscrowLedger.create({
      data: {
        tenantId,
        entryType: 'daily_deposit',
        amount: data.totalTaxCollected,
        runningBalance: newBalance,
        dailySetAsideId: setAside.id,
        description: `Daily tax set-aside for ${dateOnly.toISOString().split('T')[0]}: $${data.totalTaxCollected.toFixed(2)} (POS: $${data.posTaxCollected.toFixed(2)}, Online: $${data.onlineTaxCollected.toFixed(2)})`,
        metadata: {
          posCount: data.posTransactionCount,
          onlineCount: data.onlineOrderCount,
        },
      },
    });
  }

  return { setAside, ledgerEntry };
}

/**
 * Get the current escrow balance for a tenant.
 * Returns the running balance from the most recent ledger entry.
 */
export async function getEscrowBalance(tenantId: string): Promise<number> {
  const lastEntry = await prisma.taxEscrowLedger.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { runningBalance: true },
  });

  return lastEntry?.runningBalance ?? 0;
}

/**
 * Get paginated escrow history for a tenant.
 */
export async function getEscrowHistory(
  tenantId: string,
  options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    entryType?: string;
  } = {}
): Promise<{ entries: any[]; total: number; page: number; limit: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = options.startDate;
    if (options.endDate) where.createdAt.lt = options.endDate;
  }
  if (options.entryType) {
    where.entryType = options.entryType;
  }

  const [entries, total] = await Promise.all([
    prisma.taxEscrowLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.taxEscrowLedger.count({ where }),
  ]);

  return { entries, total, page, limit };
}

/**
 * Add an escrow ledger entry (for payments, adjustments, refunds).
 */
export async function addEscrowEntry(params: {
  tenantId: string;
  entryType: string;
  amount: number;
  description: string;
  filingPeriodId?: string;
  achPaymentId?: string;
  stripeTransferId?: string;
  metadata?: Record<string, unknown>;
}): Promise<any> {
  const currentBalance = await getEscrowBalance(params.tenantId);
  const newBalance = Math.round((currentBalance + params.amount) * 100) / 100;

  return prisma.taxEscrowLedger.create({
    data: {
      tenantId: params.tenantId,
      entryType: params.entryType,
      amount: params.amount,
      runningBalance: newBalance,
      filingPeriodId: params.filingPeriodId,
      achPaymentId: params.achPaymentId,
      stripeTransferId: params.stripeTransferId,
      description: params.description,
      metadata: params.metadata as any,
    },
  });
}

/**
 * Get daily set-aside records for a tenant within a date range.
 */
export async function getDailySetAsides(
  tenantId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ records: any[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 31;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (options.startDate || options.endDate) {
    where.date = {};
    if (options.startDate) where.date.gte = options.startDate;
    if (options.endDate) where.date.lte = options.endDate;
  }

  const [records, total] = await Promise.all([
    prisma.taxDailySetAside.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.taxDailySetAside.count({ where }),
  ]);

  return { records, total };
}
