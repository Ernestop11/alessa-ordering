import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Uber Direct Webhook Handler
 *
 * Receives real-time delivery status updates from Uber Direct
 * Documentation: https://developer.uber.com/docs/deliveries/webhooks
 *
 * Events:
 * - delivery_status: Status changes (pending, pickup, dropoff, delivered, cancelled)
 * - courier_update: Courier location updates (every 20 seconds)
 */

interface UberWebhookEvent {
  event_type: 'event.delivery_status' | 'event.courier_update' | 'event.refund_request';
  event_id: string;
  event_time: string;
  meta: {
    resource_id: string; // Delivery ID
    status?: string;
    user_id?: string;
  };
  resource_href?: string;
  delivery?: {
    id: string;
    status: string;
    tracking_url: string;
    courier?: {
      name: string;
      phone_number: string;
      vehicle_type: string;
      location?: {
        lat: number;
        lng: number;
      };
    };
    pickup_eta?: string;
    dropoff_eta?: string;
  };
}

// Map Uber status to our internal status
function mapUberStatus(uberStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    pickup: 'picking_up',
    pickup_complete: 'en_route',
    dropoff: 'en_route',
    delivered: 'delivered',
    canceled: 'cancelled',
    returned: 'returned',
  };
  return statusMap[uberStatus] || uberStatus;
}

export async function POST(req: NextRequest) {
  try {
    const body: UberWebhookEvent = await req.json();

    console.log('[Uber Webhook] Received event:', {
      type: body.event_type,
      eventId: body.event_id,
      resourceId: body.meta?.resource_id,
      status: body.meta?.status,
    });

    const uberDeliveryId = body.meta?.resource_id || body.delivery?.id;
    if (!uberDeliveryId) {
      console.error('[Uber Webhook] No delivery ID in event');
      return NextResponse.json({ error: 'No delivery ID' }, { status: 400 });
    }

    // Find order by Uber delivery ID
    const order = await prisma.order.findFirst({
      where: { uberDeliveryId },
      include: { tenant: true },
    });

    if (!order) {
      console.log('[Uber Webhook] Order not found for delivery:', uberDeliveryId);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true, message: 'Order not found' });
    }

    // Handle different event types
    switch (body.event_type) {
      case 'event.delivery_status': {
        const newStatus = body.meta?.status || body.delivery?.status;
        if (newStatus) {
          const mappedStatus = mapUberStatus(newStatus);

          await prisma.order.update({
            where: { id: order.id },
            data: {
              deliveryStatus: mappedStatus,
              deliveryTrackingUrl: body.delivery?.tracking_url || order.deliveryTrackingUrl,
            },
          });

          // Log status change
          await prisma.integrationLog.create({
            data: {
              tenantId: order.tenantId,
              source: 'uber_webhook',
              message: `Delivery status: ${newStatus}`,
              payload: {
                orderId: order.id,
                uberDeliveryId,
                previousStatus: order.deliveryStatus,
                newStatus: mappedStatus,
                courier: body.delivery?.courier,
                pickupEta: body.delivery?.pickup_eta,
                dropoffEta: body.delivery?.dropoff_eta,
              },
            },
          });

          console.log('[Uber Webhook] Updated order status:', {
            orderId: order.id,
            status: mappedStatus,
          });
        }
        break;
      }

      case 'event.courier_update': {
        // Courier location update - log for tracking
        if (body.delivery?.courier?.location) {
          await prisma.integrationLog.create({
            data: {
              tenantId: order.tenantId,
              source: 'uber_webhook',
              message: 'Courier location update',
              payload: {
                orderId: order.id,
                uberDeliveryId,
                courier: body.delivery.courier,
                location: body.delivery.courier.location,
                dropoffEta: body.delivery.dropoff_eta,
              },
            },
          });
        }
        break;
      }

      case 'event.refund_request': {
        // Handle refund request
        await prisma.integrationLog.create({
          data: {
            tenantId: order.tenantId,
            source: 'uber_webhook',
            message: 'Refund requested',
            payload: {
              orderId: order.id,
              uberDeliveryId,
              eventId: body.event_id,
            },
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Uber Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Uber may send GET requests to verify webhook URL
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'uber-direct-webhook' });
}
