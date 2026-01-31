import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getTenantBySlug } from '@/lib/tenant';

// In-memory set of connected SSE clients per tenant
type SSEClient = {
  send: (data: unknown) => void;
  close: () => void;
};

const clients = new Map<string, Set<SSEClient>>();

// Broadcast a message to all connected displays for a tenant
export function broadcastToDisplays(tenantId: string, data: unknown) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients) return;
  tenantClients.forEach((client) => {
    client.send(data);
  });
}

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

      const client: SSEClient = {
        send,
        close: () => {
          if (closed) return;
          closed = true;
          const tenantClients = clients.get(tenant.id);
          if (tenantClients) {
            tenantClients.delete(client);
            if (tenantClients.size === 0) clients.delete(tenant.id);
          }
        },
      };

      // Register client
      if (!clients.has(tenant.id)) {
        clients.set(tenant.id, new Set());
      }
      clients.get(tenant.id)!.add(client);

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
        clearInterval(heartbeat);
        client.close();
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
