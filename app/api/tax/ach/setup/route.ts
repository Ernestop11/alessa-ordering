import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getRemitianClient } from '@/lib/tax/remitian-client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Simple encryption for demo (in production, use proper encryption library)
function encryptAccountNumber(accountNumber: string, key: string): string {
  // In production, use AES-256-GCM or similar
  // This is a placeholder - implement proper encryption
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(accountNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * POST /api/tax/ach/setup
 * 
 * Link bank account for ACH payments
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
    const { routingNumber, accountNumber, accountType, accountHolderName } = body;

    if (!routingNumber || !accountNumber || !accountType || !accountHolderName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Link bank account via Remitian
    const remitian = getRemitianClient();
    const { accountId } = await remitian.linkBankAccount({
      routingNumber,
      accountNumber,
      accountType: accountType as 'checking' | 'savings',
      accountHolderName,
    });

    // Store encrypted account info in TenantIntegration
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    const paymentConfig = (integration?.paymentConfig as any) || {};
    const encryptionKey = process.env.ACCOUNT_ENCRYPTION_KEY || 'default-key-change-in-production';

    paymentConfig.remitianBankAccountId = accountId;
    paymentConfig.remitianBankAccount = {
      routingNumber, // Can store this as-is or encrypt if needed
      accountNumberEncrypted: encryptAccountNumber(accountNumber, encryptionKey),
      accountType,
      accountHolderName,
      linkedAt: new Date().toISOString(),
    };

    await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        paymentConfig: paymentConfig,
      },
      update: {
        paymentConfig: paymentConfig,
      },
    });

    // TODO: Initiate micro-deposit verification
    // In production, Remitian would send micro-deposits for verification

    return NextResponse.json({
      success: true,
      accountId,
      message: 'Bank account linked successfully. Please verify with micro-deposits when they arrive.',
    });
  } catch (error: any) {
    console.error('[tax-ach-setup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link bank account' },
      { status: 500 }
    );
  }
}

