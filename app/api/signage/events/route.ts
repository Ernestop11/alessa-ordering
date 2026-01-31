import { NextRequest } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { registerDisplayClient, unregisterDisplayClient } from '@/lib/signage-broadcast';

export async function GET(request: NextRequest) {
  const tenantSlug = request.nextUrl.searchParams.get('tenant');
  if (!tenantSlug) {
    return new Response('tenant query parameter required', { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return new Response('tenant not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // Controller may be closed
        }
      };

      const client = { send };

      registerDisplayClient(tenant.id, client);

      // Send initial ping
      send({ type: 'connected', tenantSlug: tenant.slug, timestamp: Date.now() });

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) {
          clearInterval(heartbeat);
          return;
        }
        send({ type: 'heartbeat', timestamp: Date.now() });
      }, 30_000);

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(heartbeat);
        unregisterDisplayClient(tenant.id, client);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      // noop - cleanup via abort signal
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
