import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRemitianClient } from '@/lib/tax/remitian-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tax/ach/webhook
 * 
 * Handle Remitian webhook callbacks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-remitian-signature');
    const webhookSecret = process.env.REMITIAN_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[tax-ach-webhook] REMITIAN_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    if (signature) {
      const remitian = getRemitianClient();
      const isValid = remitian.verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const { payment_id, status, confirmation_number, error_message } = event;

    if (!payment_id) {
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
    }

    // Find ACH payment by Remitian payment ID
    const achPayment = await prisma.taxAchPayment.findFirst({
      where: {
        remitianPaymentId: payment_id,
      },
      include: {
        remittance: true,
        tenant: true,
      },
    });

    if (!achPayment) {
      console.warn(`[tax-ach-webhook] Payment not found: ${payment_id}`);
      return NextResponse.json({ received: true, message: 'Payment not found' });
    }

    // Update payment status
    await prisma.taxAchPayment.update({
      where: { id: achPayment.id },
      data: {
        status: status,
        processedAt: status === 'completed' ? new Date() : undefined,
        confirmationNo: confirmation_number,
        errorMessage: error_message,
      },
    });

    // Update remittance if payment completed
    if (status === 'completed' && achPayment.remittance) {
      await prisma.taxRemittance.update({
        where: { id: achPayment.remittanceId },
        data: {
          status: 'completed',
          totalTaxRemitted: achPayment.remittance.totalTaxCollected,
          remittanceDate: new Date(),
          remittanceReference: confirmation_number,
        },
      });

      // TODO: Send notification to tenant
      await prisma.integrationLog.create({
        data: {
          tenantId: achPayment.tenantId,
          source: 'tax_ach',
          message: `ACH payment completed: ${confirmation_number}`,
          payload: {
            paymentId: achPayment.id,
            remitianPaymentId: payment_id,
            amount: achPayment.amount,
            confirmationNumber: confirmation_number,
          },
        },
      });
    } else if (status === 'failed') {
      // Update remittance to failed
      await prisma.taxRemittance.update({
        where: { id: achPayment.remittanceId },
        data: {
          status: 'failed',
          notes: error_message || 'ACH payment failed',
        },
      });

      // TODO: Send notification to tenant
      await prisma.integrationLog.create({
        data: {
          tenantId: achPayment.tenantId,
          source: 'tax_ach',
          level: 'error',
          message: `ACH payment failed: ${error_message}`,
          payload: {
            paymentId: achPayment.id,
            remitianPaymentId: payment_id,
            error: error_message,
          },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[tax-ach-webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

