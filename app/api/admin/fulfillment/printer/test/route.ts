import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { formatReceiptForPrinter } from '@/lib/printer-service';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();

  try {
    const body = await req.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Printer configuration is required' },
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

    // Get tenant info for test receipt
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        contactPhone: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create test order data
    const testOrder = {
      id: 'TEST-' + Date.now(),
      customerName: 'Test Customer',
      customerPhone: '(555) 123-4567',
      fulfillmentMethod: 'pickup' as const,
      status: 'pending' as const,
      items: [
        {
          name: 'Test Item 1',
          quantity: 2,
          unitPrice: 10.00,
          totalPrice: 20.00,
        },
        {
          name: 'Test Item 2',
          quantity: 1,
          unitPrice: 15.00,
          totalPrice: 15.00,
        },
      ],
      subtotal: 35.00,
      taxAmount: 2.89,
      totalAmount: 37.89,
      notes: 'This is a test print',
      createdAt: new Date(),
    };

    // Format receipt
    const receiptData = formatReceiptForPrinter(testOrder, tenant, config.model);

    // Log test print
    await prisma.integrationLog.create({
      data: {
        tenantId: user.tenantId,
        source: 'printer',
        message: `Test print sent: ${config.type} - ${config.name}`,
        payload: JSON.parse(JSON.stringify({
          config,
          receiptLength: receiptData.length,
        })),
      },
    });

    // Return receipt data for client-side printing
    // In production, this would send directly to printer
    return NextResponse.json({
      success: true,
      message: 'Test print data generated',
      receiptData,
      config,
      instructions: getClientInstructions(config),
    });
  } catch (error) {
    console.error('[Printer Test] Error:', error);
    return NextResponse.json(
      { error: 'Test print failed' },
      { status: 500 }
    );
  }
}

function getClientInstructions(config: any): string {
  switch (config.type) {
    case 'bluetooth':
      return 'Connect to Bluetooth device and send ESC/POS commands via Web Bluetooth API';
    case 'network':
      return `Send raw data to ${config.ipAddress}:${config.port || 9100} via network socket`;
    case 'usb':
      return 'Use WebUSB API or browser print dialog';
    default:
      return 'Unknown printer type';
  }
}
