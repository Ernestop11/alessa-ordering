import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getRemitianClient } from '@/lib/tax/remitian-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tax/ach/status?id={paymentId}
 * 
 * Check status of ACH payment
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    // Get ACH payment record
    const achPayment = await prisma.taxAchPayment.findFirst({
      where: {
        id: paymentId,
        tenantId: tenant.id,
      },
      include: {
        remittance: true,
      },
    });

    if (!achPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (!achPayment.remitianPaymentId) {
      return NextResponse.json({
        paymentId: achPayment.id,
        status: achPayment.status,
        message: 'Payment ID not yet assigned',
      });
    }

    // Query Remitian for latest status
    const remitian = getRemitianClient();
    const paymentStatus = await remitian.getPaymentStatus(achPayment.remitianPaymentId);

    // Update database with latest status
    await prisma.taxAchPayment.update({
      where: { id: paymentId },
      data: {
        status: paymentStatus.status,
        processedAt: paymentStatus.processedAt,
        confirmationNo: paymentStatus.confirmationNumber,
        errorMessage: paymentStatus.errorMessage,
      },
    });

    // If payment completed, update remittance
    if (paymentStatus.status === 'completed' && achPayment.remittance) {
      await prisma.taxRemittance.update({
        where: { id: achPayment.remittanceId },
        data: {
          status: 'completed',
          totalTaxRemitted: achPayment.remittance.totalTaxCollected,
          remittanceDate: new Date(),
          remittanceReference: paymentStatus.confirmationNumber,
        },
      });
    }

    return NextResponse.json({
      paymentId: achPayment.id,
      status: paymentStatus.status,
      amount: paymentStatus.amount,
      recipientName: paymentStatus.recipientName,
      confirmationNumber: paymentStatus.confirmationNumber,
      processedAt: paymentStatus.processedAt,
      errorMessage: paymentStatus.errorMessage,
    });
  } catch (error: any) {
    console.error('[tax-ach-status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment status' },
      { status: 500 }
    );
  }
}

