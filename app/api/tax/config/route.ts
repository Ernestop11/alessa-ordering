import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * GET /api/tax/config
 *
 * Returns the tax automation configuration for the authenticated tenant.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Tenant integration not found' }, { status: 404 });
    }

    return NextResponse.json({
      taxAutoSetAsideEnabled: integration.taxAutoSetAsideEnabled ?? false,
      taxFilingState: integration.taxFilingState ?? 'CA',
      taxFilingFrequency: integration.taxFilingFrequency ?? 'quarterly',
      taxCdtfaAccountNumber: integration.taxCdtfaAccountNumber ?? '',
      taxEin: integration.taxEin ?? '',
      taxStateId: integration.taxStateId ?? '',
      taxAutoPayEnabled: integration.taxAutoPayEnabled ?? false,
      taxRemittanceEnabled: integration.taxRemittanceEnabled ?? false,
      taxRemittanceSchedule: integration.taxRemittanceSchedule ?? 'quarterly',
      taxProvider: integration.taxProvider ?? 'builtin',
      defaultTaxRate: integration.defaultTaxRate ?? 0.0825,
    });
  } catch (error: any) {
    console.error('[Tax Config GET]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tax config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tax/config
 *
 * Update the tax automation configuration for the authenticated tenant.
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const body = await request.json();

    const allowedFields = [
      'taxAutoSetAsideEnabled',
      'taxFilingState',
      'taxFilingFrequency',
      'taxCdtfaAccountNumber',
      'taxEin',
      'taxStateId',
      'taxAutoPayEnabled',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: updateData,
    });

    return NextResponse.json({
      taxAutoSetAsideEnabled: updated.taxAutoSetAsideEnabled ?? false,
      taxFilingState: updated.taxFilingState ?? 'CA',
      taxFilingFrequency: updated.taxFilingFrequency ?? 'quarterly',
      taxCdtfaAccountNumber: updated.taxCdtfaAccountNumber ?? '',
      taxEin: updated.taxEin ?? '',
      taxStateId: updated.taxStateId ?? '',
      taxAutoPayEnabled: updated.taxAutoPayEnabled ?? false,
    });
  } catch (error: any) {
    console.error('[Tax Config PUT]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tax config' },
      { status: 500 }
    );
  }
}
