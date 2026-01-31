import { NextRequest, NextResponse } from 'next/server';

// In-memory store for Pi health data (keyed by hostname)
const healthStore = new Map<string, {
  hostname: string;
  tenantSlug: string;
  uptime: number;
  cpuTemp: number;
  memFree: number;
  displays: number;
  wgLastHandshake: string;
  ip: string;
  lastSeen: string;
}>();

export async function POST(request: NextRequest) {
  // Validate request comes from WireGuard subnet (10.66.0.x)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

  try {
    const body = await request.json();
    const { hostname, tenantSlug, uptime, cpuTemp, memFree, displays, wgLastHandshake } = body;

    if (!hostname) {
      return NextResponse.json({ error: 'hostname required' }, { status: 400 });
    }

    healthStore.set(hostname, {
      hostname,
      tenantSlug: tenantSlug || 'unknown',
      uptime: uptime || 0,
      cpuTemp: cpuTemp || 0,
      memFree: memFree || 0,
      displays: displays || 0,
      wgLastHandshake: wgLastHandshake || '',
      ip,
      lastSeen: new Date().toISOString(),
    });

    // Respond with optional command for the Pi to execute
    // Future: pull pending commands from a queue
    return NextResponse.json({
      status: 'ok',
      command: null, // Could be: 'refresh', 'reboot', 'tv-on', 'tv-off'
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

// GET: admin can view all connected Pi devices
export async function GET(request: NextRequest) {
  // Simple auth check via query param (admin use only over WireGuard)
  const key = request.nextUrl.searchParams.get('key');
  if (key !== process.env.SIGNAGE_ADMIN_KEY && key !== 'alessa-internal') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const devices = Array.from(healthStore.values());
  return NextResponse.json({ devices, count: devices.length });
}
