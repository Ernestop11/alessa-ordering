import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// GET - Retrieve printer configuration
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  try {
    const user = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: { tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: user.tenantId },
      select: { printerConfig: true },
    });

    return NextResponse.json({
      config: integration?.printerConfig || null,
    });
  } catch (error) {
    console.error('[Printer Config] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve printer configuration' },
      { status: 500 }
    );
  }
}

// POST - Save printer configuration
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  try {
    const body = await req.json();
    const { type, name, deviceId, ipAddress, port, model } = body;

    // Validation
    if (!type || !name) {
      return NextResponse.json(
        { error: 'Printer type and name are required' },
        { status: 400 }
      );
    }

    if (type === 'bluetooth' && !deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required for Bluetooth printers' },
        { status: 400 }
      );
    }

    if (type === 'network' && !ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required for network printers' },
        { status: 400 }
      );
    }

    const user = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: { tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Build printer config object
    const printerConfig: any = {
      type,
      name,
      model: model || 'ESC/POS',
      updatedAt: new Date().toISOString(),
    };

    if (type === 'bluetooth') {
      printerConfig.deviceId = deviceId;
    } else if (type === 'network') {
      printerConfig.ipAddress = ipAddress;
      printerConfig.port = port || 9100;
    }

    // Save to tenant integration
    await prisma.tenantIntegration.upsert({
      where: { tenantId: user.tenantId },
      update: {
        printerConfig: JSON.parse(JSON.stringify(printerConfig)),
      },
      create: {
        tenantId: user.tenantId,
        printerConfig: JSON.parse(JSON.stringify(printerConfig)),
      },
    });

    // Log the configuration change
    await prisma.integrationLog.create({
      data: {
        tenantId: user.tenantId,
        source: 'printer',
        message: `Printer configuration updated: ${type} - ${name}`,
        payload: JSON.parse(JSON.stringify(printerConfig)),
      },
    });

    return NextResponse.json({
      success: true,
      config: printerConfig,
    });
  } catch (error) {
    console.error('[Printer Config] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save printer configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove printer configuration
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  try {
    const user = await prisma.customer.findUnique({
      where: { email: session.user.email },
      select: { tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    await prisma.tenantIntegration.update({
      where: { tenantId: user.tenantId },
      data: {
        printerConfig: null,
      },
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: user.tenantId,
        source: 'printer',
        message: 'Printer configuration removed',
        payload: {},
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Printer configuration removed',
    });
  } catch (error) {
    console.error('[Printer Config] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove printer configuration' },
      { status: 500 }
    );
  }
}
