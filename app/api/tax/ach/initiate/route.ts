import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getRemitianClient } from '@/lib/tax/remitian-client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tax/ach/initiate
 * 
 * Initiate ACH payment for tax remittance
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { remittanceId, recipientName, recipientType, routingNumber, accountNumber, memo } = body;

    if (!remittanceId || !recipientName || !recipientType || !routingNumber || !accountNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get remittance
    const remittance = await prisma.taxRemittance.findFirst({
      where: {
        id: remittanceId,
        tenantId: tenant.id,
      },
    });

    if (!remittance) {
      return NextResponse.json({ error: 'Remittance not found' }, { status: 404 });
    }

    if (remittance.status === 'completed') {
      return NextResponse.json(
        { error: 'Remittance already processed' },
        { status: 400 }
      );
    }

    // Get tenant's linked bank account (stored in TenantIntegration)
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    const bankAccountId = (integration?.paymentConfig as any)?.remitianBankAccountId;
    if (!bankAccountId) {
      return NextResponse.json(
        { error: 'Bank account not linked. Please set up ACH payment first.' },
        { status: 400 }
      );
    }

    // Initialize Remitian client
    const remitian = getRemitianClient();

    // Create ACH payment
    const paymentResult = await remitian.createPayment({
      amount: remittance.totalTaxCollected - remittance.totalTaxRemitted,
      recipientName,
      recipientType: recipientType as 'state' | 'city' | 'county',
      routingNumber,
      accountNumber, // In production, this should come from secure storage
      memo: memo || `Tax remittance for period ${remittance.periodStart.toISOString()} - ${remittance.periodEnd.toISOString()}`,
      sourceAccountId: bankAccountId,
    });

    // Create TaxAchPayment record
    const achPayment = await prisma.taxAchPayment.create({
      data: {
        tenantId: tenant.id,
        remittanceId: remittance.id,
        remitianPaymentId: paymentResult.paymentId,
        recipientType: recipientType,
        recipientName,
        routingNumber,
        accountNumber: accountNumber, // In production, encrypt this
        amount: remittance.totalTaxCollected - remittance.totalTaxRemitted,
        status: 'pending',
      },
    });

    // Update remittance status
    await prisma.taxRemittance.update({
      where: { id: remittanceId },
      data: {
        status: 'processing',
        remittanceMethod: 'automatic',
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: achPayment.id,
      remitianPaymentId: paymentResult.paymentId,
      status: paymentResult.status,
      expectedCompletionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    });
  } catch (error: any) {
    console.error('[tax-ach-initiate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate ACH payment' },
      { status: 500 }
    );
  }
}

