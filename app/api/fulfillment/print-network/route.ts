import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import net from 'net';

const NETWORK_PRINTER_TIMEOUT = Number(process.env.PRINTER_TCP_TIMEOUT ?? 5000);

/**
 * Send ESC/POS data to network printer via TCP
 */
async function sendToNetworkPrinter(host: string, port: number, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: NETWORK_PRINTER_TIMEOUT }, () => {
      socket.write(Buffer.from(data, 'binary'), (err) => {
        if (err) {
          socket.destroy();
          reject(err);
          return;
        }
        socket.end();
      });
    });

    let settled = false;
    const finalize = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    socket.on('close', () => finalize());
    socket.on('error', (error) => finalize(error instanceof Error ? error : new Error(String(error))));
    socket.on('timeout', () => {
      socket.destroy();
      finalize(new Error('Network printer connection timed out'));
    });
  });
}

/**
 * Network printer relay endpoint
 *
 * This endpoint receives print data from the client and sends it to a network printer.
 * NOTE: This only works if the VPS can reach the printer (e.g., VPN, or printer is internet-accessible).
 * For local network printers, a local print relay service is needed.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { host, port = 9100, data, orderId } = body;

    if (!host) {
      return NextResponse.json({ error: 'host is required' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'data is required' }, { status: 400 });
    }

    // Validate that this is the tenant's configured printer (security check)
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: { printerConfig: true },
    });

    const printerConfig = integration?.printerConfig as any;
    const configuredHost = printerConfig?.host || printerConfig?.ipAddress;

    // Allow printing if no printer is configured (for testing) or if hosts match
    if (configuredHost && configuredHost !== host) {
      return NextResponse.json(
        { error: 'Printer host does not match configured printer' },
        { status: 403 }
      );
    }

    console.log(`[Print Network] Sending to ${host}:${port}${orderId ? ` for order ${orderId}` : ''}`);

    try {
      await sendToNetworkPrinter(host, port, data);

      // Log successful print
      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'printer',
          level: 'info',
          message: `Network print job sent to ${host}:${port}`,
          payload: {
            orderId: orderId || null,
            host,
            port,
            dataLength: data.length,
          },
        },
      });

      return NextResponse.json({ success: true });
    } catch (printError) {
      const errorMessage = printError instanceof Error ? printError.message : 'Unknown print error';

      // Check if it's a network unreachable error
      const isNetworkError = errorMessage.includes('ENETUNREACH') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('EHOSTUNREACH');

      if (isNetworkError) {
        console.error(`[Print Network] Cannot reach printer ${host}:${port} - printer may be on a different network`);

        // Log the error
        await prisma.integrationLog.create({
          data: {
            tenantId: tenant.id,
            source: 'printer',
            level: 'error',
            message: `Network printer unreachable: ${host}:${port}`,
            payload: {
              orderId: orderId || null,
              host,
              port,
              error: errorMessage,
              hint: 'VPS cannot reach local network printers. Consider using a local print relay service.',
            },
          },
        });

        return NextResponse.json({
          success: false,
          error: 'Printer unreachable from server. The printer may be on a local network that the server cannot access.',
          hint: 'For local network printers, you may need a print relay service on your local network.',
        }, { status: 502 });
      }

      throw printError;
    }
  } catch (error: any) {
    console.error('[Print Network] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to print' },
      { status: 500 }
    );
  }
}
