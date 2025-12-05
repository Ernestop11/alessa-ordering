/**
 * Ecosystem Communication Layer
 * The "mycelium network" - allows all Alessa products to communicate
 */

import prisma from '@/lib/prisma';

export type EcosystemProduct = 
  | 'ORDERING' 
  | 'SMP' 
  | 'MARKETING_APP' 
  | 'WEB_HOSTING' 
  | 'DIGITAL_MENU'
  | 'MINI_BODEGA';

export type EcosystemEventType =
  | 'order_created'
  | 'order_updated'
  | 'order_completed'
  | 'menu_updated'
  | 'menu_item_added'
  | 'menu_item_updated'
  | 'menu_item_deleted'
  | 'tenant_status_changed'
  | 'sync_completed'
  | 'sync_failed'
  | 'customer_created'
  | 'customer_updated';

export interface EcosystemEventPayload {
  [key: string]: any;
}

/**
 * Emit an event to the ecosystem
 * Other products can listen to these events
 */
export async function emitEvent(
  eventType: EcosystemEventType,
  source: EcosystemProduct,
  payload: EcosystemEventPayload,
  tenantId?: string,
  target?: EcosystemProduct
) {
  try {
    const event = await prisma.ecosystemEvent.create({
      data: {
        tenantId: tenantId || null,
        eventType,
        source,
        target: target || null,
        payload,
      },
    });

    console.log(`[Ecosystem] Event emitted: ${eventType} from ${source}`, {
      eventId: event.id,
      tenantId,
    });

    return event;
  } catch (error) {
    console.error('[Ecosystem] Error emitting event:', error);
    throw error;
  }
}

/**
 * Listen for events (used by other products)
 * Returns unprocessed events matching criteria
 */
export async function listenForEvents(
  eventTypes: EcosystemEventType[],
  target?: EcosystemProduct,
  tenantId?: string,
  limit: number = 50
) {
  try {
    const where: any = {
      eventType: { in: eventTypes },
      processed: false,
    };

    if (target) {
      where.target = target;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const events = await prisma.ecosystemEvent.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return events;
  } catch (error) {
    console.error('[Ecosystem] Error listening for events:', error);
    throw error;
  }
}

/**
 * Mark events as processed
 */
export async function markEventsProcessed(eventIds: string[]) {
  try {
    await prisma.ecosystemEvent.updateMany({
      where: {
        id: { in: eventIds },
      },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    console.log(`[Ecosystem] Marked ${eventIds.length} events as processed`);
  } catch (error) {
    console.error('[Ecosystem] Error marking events as processed:', error);
    throw error;
  }
}

/**
 * Get sync status for a tenant and product
 */
export async function getSyncStatus(tenantId: string, productType: EcosystemProduct) {
  try {
    const sync = await prisma.tenantSync.findUnique({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
    });

    return sync;
  } catch (error) {
    console.error('[Ecosystem] Error getting sync status:', error);
    return null;
  }
}

/**
 * Update sync status
 */
export async function updateSyncStatus(
  tenantId: string,
  productType: EcosystemProduct,
  status: 'pending' | 'syncing' | 'success' | 'error',
  error?: string,
  config?: any
) {
  try {
    const sync = await prisma.tenantSync.upsert({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
      create: {
        tenantId,
        productType,
        syncStatus: status,
        syncError: error || null,
        syncConfig: config || null,
        lastSyncAt: status === 'success' ? new Date() : null,
      },
      update: {
        syncStatus: status,
        syncError: error || null,
        syncConfig: config || undefined,
        lastSyncAt: status === 'success' ? new Date() : undefined,
      },
    });

    // Emit sync event
    await emitEvent(
      status === 'success' ? 'sync_completed' : 'sync_failed',
      'ORDERING',
      { tenantId, productType, status, error },
      tenantId,
      productType
    );

    return sync;
  } catch (error) {
    console.error('[Ecosystem] Error updating sync status:', error);
    throw error;
  }
}

/**
 * Helper: Emit menu update event
 */
export async function emitMenuUpdate(
  tenantId: string,
  action: 'added' | 'updated' | 'deleted',
  menuItemId: string,
  menuItemName: string
) {
  const eventType = `menu_item_${action}` as EcosystemEventType;
  return emitEvent(
    eventType,
    'ORDERING',
    {
      menuItemId,
      menuItemName,
      action,
    },
    tenantId,
    'SMP' // Notify SMP when menu changes
  );
}

/**
 * Helper: Emit order event
 */
export async function emitOrderEvent(
  tenantId: string,
  eventType: 'order_created' | 'order_updated' | 'order_completed',
  orderId: string,
  orderData: any
) {
  return emitEvent(
    eventType,
    'ORDERING',
    {
      orderId,
      ...orderData,
    },
    tenantId
  );
}

