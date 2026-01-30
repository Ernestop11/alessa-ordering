import prisma from '@/lib/prisma';
import { getRemitianClient } from './remitian-client';
import { addEscrowEntry } from './escrow-service';

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

/**
 * Initiate ACH payment to CDTFA for a filing period.
 * Uses the existing RemitianClient for ACH transfers.
 */
export async function initiateAutoPayment(
  filingPeriodId: string
): Promise<PaymentResult> {
  const period = await prisma.taxFilingPeriod.findUnique({
    where: { id: filingPeriodId },
    include: {
      tenant: {
        include: { integrations: true },
      },
    },
  });

  if (!period) {
    return { success: false, error: 'Filing period not found' };
  }

  if (period.paymentStatus === 'payment_confirmed' || period.paymentStatus === 'completed') {
    return { success: false, error: 'Payment already completed' };
  }

  if (period.filingStatus !== 'filed' && period.filingStatus !== 'confirmed') {
    return { success: false, error: 'Filing must be completed before payment' };
  }

  const paymentAmount = period.totalTaxCollected;
  if (paymentAmount <= 0) {
    return { success: false, error: 'No tax amount to pay' };
  }

  try {
    const remitian = getRemitianClient();

    // Get CDTFA recipient info
    const recipients = await remitian.getGovernmentRecipients(period.state, 'sales_tax');
    const cdtfa = recipients[0]; // Primary state tax authority

    if (!cdtfa) {
      return { success: false, error: `No tax authority found for state ${period.state}` };
    }

    const integration = period.tenant.integrations;
    const ein = integration?.taxEin ?? '';
    const permitNumber = integration?.taxCdtfaAccountNumber ?? '';
    const quarterLabel = period.quarter ? `Q${period.quarter}` : `M${period.month}`;

    const result = await remitian.createPayment({
      amount: paymentAmount,
      recipientName: cdtfa.name,
      recipientType: cdtfa.recipientType,
      routingNumber: cdtfa.routingNumber,
      accountNumber: cdtfa.accountNumber,
      memo: `Sales Tax ${quarterLabel} ${period.year} | Permit: ${permitNumber} | EIN: ${ein}`,
      sourceAccountId: integration?.taxEscrowAccountId ?? '',
    });

    // Create TaxAchPayment record
    // First ensure we have a TaxRemittance to link to
    let remittanceId = period.remittanceId;
    if (!remittanceId) {
      const remittance = await prisma.taxRemittance.create({
        data: {
          tenantId: period.tenantId,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          totalTaxCollected: period.totalTaxCollected,
          status: 'processing',
          remittanceMethod: 'automatic',
        },
      });
      remittanceId = remittance.id;
    }

    await prisma.taxAchPayment.create({
      data: {
        tenantId: period.tenantId,
        remittanceId,
        remitianPaymentId: result.paymentId,
        recipientType: cdtfa.recipientType,
        recipientName: cdtfa.name,
        routingNumber: cdtfa.routingNumber,
        accountNumber: cdtfa.accountNumber,
        amount: paymentAmount,
        status: 'processing',
      },
    });

    // Update filing period
    await prisma.taxFilingPeriod.update({
      where: { id: filingPeriodId },
      data: {
        paymentStatus: 'payment_initiated',
        paymentAmount: paymentAmount,
        paymentMethod: 'ach_remitian',
        paymentReference: result.paymentId,
        remittanceId,
      },
    });

    // Record escrow outflow
    await addEscrowEntry({
      tenantId: period.tenantId,
      entryType: 'tax_payment',
      amount: -paymentAmount,
      description: `ACH payment to ${cdtfa.name} for ${quarterLabel} ${period.year}: $${paymentAmount.toFixed(2)}`,
      filingPeriodId: period.id,
      achPaymentId: result.paymentId,
    });

    console.log(
      `[Tax Auto-Pay] Initiated $${paymentAmount.toFixed(2)} ACH to ${cdtfa.name} for period ${filingPeriodId}`
    );

    return { success: true, paymentId: result.paymentId };
  } catch (error: any) {
    console.error('[Tax Auto-Pay] Payment failed:', error);

    await prisma.taxFilingPeriod.update({
      where: { id: filingPeriodId },
      data: {
        notes: `Payment failed: ${error.message}`,
      },
    });

    return { success: false, error: error.message || 'Payment failed' };
  }
}

/**
 * Poll Remitian for status updates on pending ACH payments.
 * Called by the daily payment status cron.
 */
export async function pollPaymentStatuses(): Promise<{
  checked: number;
  updated: number;
  errors: string[];
}> {
  const pendingPayments = await prisma.taxAchPayment.findMany({
    where: {
      status: { in: ['pending', 'processing'] },
      remitianPaymentId: { not: null },
    },
  });

  let updated = 0;
  const errors: string[] = [];

  for (const payment of pendingPayments) {
    try {
      const remitian = getRemitianClient();
      const status = await remitian.getPaymentStatus(payment.remitianPaymentId!);

      if (status.status !== payment.status) {
        await prisma.taxAchPayment.update({
          where: { id: payment.id },
          data: {
            status: status.status,
            processedAt: status.processedAt ?? undefined,
            confirmationNo: status.confirmationNumber ?? undefined,
            errorMessage: status.errorMessage ?? undefined,
          },
        });

        // If completed, update the filing period
        if (status.status === 'completed') {
          // Find the filing period linked via remittance
          const filingPeriod = await prisma.taxFilingPeriod.findFirst({
            where: { remittanceId: payment.remittanceId },
          });

          if (filingPeriod) {
            await prisma.taxFilingPeriod.update({
              where: { id: filingPeriod.id },
              data: {
                paymentStatus: 'payment_confirmed',
                paymentReference: status.confirmationNumber ?? payment.remitianPaymentId,
                paidAt: status.processedAt ?? new Date(),
              },
            });
          }

          // Update remittance
          await prisma.taxRemittance.update({
            where: { id: payment.remittanceId },
            data: {
              status: 'completed',
              totalTaxRemitted: payment.amount,
              remittanceDate: status.processedAt ?? new Date(),
              remittanceReference: status.confirmationNumber ?? undefined,
            },
          });
        }

        if (status.status === 'failed') {
          const filingPeriod = await prisma.taxFilingPeriod.findFirst({
            where: { remittanceId: payment.remittanceId },
          });
          if (filingPeriod) {
            await prisma.taxFilingPeriod.update({
              where: { id: filingPeriod.id },
              data: {
                paymentStatus: 'pending',
                notes: `ACH payment failed: ${status.errorMessage || 'Unknown error'}. Manual payment may be needed.`,
              },
            });
          }
        }

        updated++;
      }
    } catch (error: any) {
      errors.push(`Payment ${payment.id}: ${error.message}`);
    }
  }

  return { checked: pendingPayments.length, updated, errors };
}
