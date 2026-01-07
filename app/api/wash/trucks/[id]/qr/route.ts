import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

// GET /api/wash/trucks/[id]/qr - Generate QR code image for truck
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const format = req.nextUrl.searchParams.get('format') || 'png';
    const size = parseInt(req.nextUrl.searchParams.get('size') || '300');

    const truck = await prisma.truck.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        fleet: { select: { name: true } },
      },
    });

    if (!truck) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    // QR code contains the qrCode UUID - scanner will use this to lookup truck
    const qrContent = truck.qrCode;

    if (format === 'svg') {
      const svgString = await QRCode.toString(qrContent, {
        type: 'svg',
        width: size,
        margin: 2,
      });

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `inline; filename="truck-${truck.truckNumber}-qr.svg"`,
        },
      });
    }

    // Default to PNG
    const pngBuffer = await QRCode.toBuffer(qrContent, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="truck-${truck.truckNumber}-qr.png"`,
      },
    });
  } catch (error) {
    console.error('[wash/trucks/[id]/qr] Error:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
