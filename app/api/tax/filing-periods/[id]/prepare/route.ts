import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { generateCDTFAReturnData, generateCDTFAReturnHTML } from '@/lib/tax/cdtfa-return-generator';

/**
 * POST /api/tax/filing-periods/[id]/prepare
 *
 * Generate pre-filled CDTFA return data for a filing period.
 * Updates the period's filingData and filingStatus.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();

    const period = await prisma.taxFilingPeriod.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!period) {
      return NextResponse.json({ error: 'Filing period not found' }, { status: 404 });
    }

    // Generate return data
    const returnData = await generateCDTFAReturnData(tenant.id, period.id);
    const returnHTML = generateCDTFAReturnHTML(returnData);

    // Update the filing period with prepared data
    const updated = await prisma.taxFilingPeriod.update({
      where: { id: period.id },
      data: {
        filingStatus: 'filing_prepared',
        filingData: returnData as any,
        totalGrossSales: returnData.line1_grossSales,
        totalTaxableSales: returnData.line5_taxableSales,
        totalTaxCollected: returnData.line10_totalTaxDue,
      },
    });

    return NextResponse.json({
      period: updated,
      returnData,
      returnHTML,
    });
  } catch (error: any) {
    console.error('[Tax Filing Prepare]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to prepare filing' },
      { status: 500 }
    );
  }
}
