/**
 * Signage display broadcast system
 *
 * Notifies connected TV display screens (via SSE) when menu data changes.
 * Uses an in-memory client registry - works because Next.js API routes
 * and SSE connections share the same Node.js process.
 */

type SSEClient = {
  send: (data: unknown) => void;
};

// In-memory registry of connected SSE display clients per tenant
const displayClients = new Map<string, Set<SSEClient>>();

/** Register a display SSE client for a tenant */
export function registerDisplayClient(tenantId: string, client: SSEClient) {
  if (!displayClients.has(tenantId)) {
    displayClients.set(tenantId, new Set());
  }
  displayClients.get(tenantId)!.add(client);
}

/** Unregister a display SSE client */
export function unregisterDisplayClient(tenantId: string, client: SSEClient) {
  const clients = displayClients.get(tenantId);
  if (clients) {
    clients.delete(client);
    if (clients.size === 0) displayClients.delete(tenantId);
  }
}

/** Broadcast a menu update to all connected display screens for a tenant */
export function notifyDisplaysMenuChanged(tenantId: string) {
  const clients = displayClients.get(tenantId);
  if (!clients || clients.size === 0) return;

  const payload = { type: 'refresh', reason: 'menu-changed', timestamp: Date.now() };
  clients.forEach((client) => {
    try {
      client.send(payload);
    } catch {
      // Client may have disconnected
    }
  });
}

/** Get count of connected display clients for a tenant */
export function getDisplayClientCount(tenantId: string): number {
  return displayClients.get(tenantId)?.size ?? 0;
}
