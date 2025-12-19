import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { generateCheckPDF } from '@/lib/tax/check-printer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tax/checks/print?id={checkId}
 * 
 * Generate PDF for printing a tax check
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
    const checkId = searchParams.get('id');

    if (!checkId) {
      return NextResponse.json(
        { error: 'check id is required' },
        { status: 400 }
      );
    }

    const check = await prisma.taxCheck.findFirst({
      where: {
        id: checkId,
        tenantId: tenant.id,
      },
    });

    if (!check) {
      return NextResponse.json(
        { error: 'Check not found' },
        { status: 404 }
      );
    }

    // Generate check PDF
    const pdfBuffer = await generateCheckPDF({
      checkNumber: check.checkNumber,
      payee: check.payee,
      amount: check.amount,
      memo: check.memo,
      tenantName: tenant.name,
      tenantAddress: {
        line1: tenant.addressLine1,
        line2: tenant.addressLine2,
        city: tenant.city,
        state: tenant.state,
        zip: tenant.postalCode,
      },
      date: new Date(),
    });

    // Update check status to printed
    await prisma.taxCheck.update({
      where: { id: checkId },
      data: {
        status: 'printed',
        printedAt: new Date(),
      },
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="check-${check.checkNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[tax-checks-print] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate check PDF' },
      { status: 500 }
    );
  }
}

