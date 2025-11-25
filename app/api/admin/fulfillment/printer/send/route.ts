import net from 'net';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const runtime = 'nodejs';

const NETWORK_PRINTER_TIMEOUT = Number(process.env.PRINTER_TCP_TIMEOUT ?? 5000);

async function dispatchToNetworkPrinter(host: string, port: number, data: string) {
  return new Promise<void>((resolve, reject) => {
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
      finalize(new Error('Printer connection timed out'));
    });
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let tenant;
  try {
    tenant = await requireTenant();
  } catch (error) {
    console.error('[printer-send] Tenant resolution failed', error);
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const ipAddress = typeof body.ipAddress === 'string' ? body.ipAddress.trim() : '';
    const port = Number(body.port ?? 9100);
    const data = typeof body.data === 'string' ? body.data : '';
    const orderId = typeof body.orderId === 'string' ? body.orderId : null;

    if (!ipAddress || Number.isNaN(port) || port <= 0 || port > 65535 || !data) {
      return NextResponse.json(
        { error: 'Printer IP, port, and data are required.' },
        { status: 400 },
      );
    }

    await dispatchToNetworkPrinter(ipAddress, port, data);

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'printer',
        message: `Dispatched print job to ${ipAddress}:${port}${orderId ? ` for ${orderId.slice(-6)}` : ''}`,
        payload: {
          orderId,
          ipAddress,
          port,
          bytes: data.length,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[printer-send] Failed to dispatch print job', error);
    return NextResponse.json(
      { error: 'Failed to dispatch print job' },
      { status: 500 },
    );
  }
}

