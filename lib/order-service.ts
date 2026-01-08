import prisma from './prisma';
import { emitOrderEvent } from './order-events';
import { serializeOrder } from './order-serializer';
import { autoPrintOrder } from './printer-dispatcher';
import { calculateOrderTax } from './tax/calculate-tax';
import { notifyFulfillmentTeam } from './notifications/fulfillment';
import { validateOperatingHours } from './hours-validator';

export interface OrderItemPayload {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string | null;
  itemType?: 'food' | 'grocery' | 'bakery' | null; // Track item category for fulfillment
}

export interface OrderPayload {
  items: OrderItemPayload[];
  subtotalAmount: number;
  totalAmount: number;
  taxAmount?: number;
  deliveryFee?: number;
  tipAmount?: number;
  platformFee?: number;
  fulfillmentMethod: string;
  deliveryPartner?: string | null;
  deliveryQuoteId?: string | null;
  paymentMethod?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  destination?: {
    postalCode?: string | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    line1?: string | null;
    line2?: string | null;
  } | null;
  deliveryAddress?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    instructions?: string | null;
  } | null;
  metadata?: {
    becomeMember?: boolean;
    joinRewards?: boolean;
    [key: string]: any;
  };
  // Group order context
  groupSessionCode?: string;
  participantName?: string;
  // Scheduled pickup time (null = ASAP)
  scheduledPickupTime?: string | null;
}

interface TenantWithRelations {
  id: string;
  slug: string;
  name?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  settings?: {
    membershipProgram?: unknown;
  } | null;
  integrations?: {
    taxProvider?: string | null;
    taxConfig?: unknown;
    defaultTaxRate?: number | null;
  } | null;
}

export async function createOrderFromPayload({
  tenant,
  payload,
  paymentIntentId,
}: {
  tenant: TenantWithRelations;
  payload: OrderPayload;
  paymentIntentId?: string | null;
}) {
  // Validate if restaurant is open before creating order
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
    select: { operatingHours: true, isOpen: true },
  });

  const hoursValidation = validateOperatingHours(
    tenantSettings?.operatingHours as any,
    tenantSettings?.isOpen ?? false // Default to closed if not set
  );

  if (!hoursValidation.isOpen) {
    throw new Error(hoursValidation.message || 'Restaurant is currently closed. Please try again during our operating hours.');
  }

  const subtotalAmount = Number(payload.subtotalAmount || 0);
  const totalAmount = Number(payload.totalAmount || subtotalAmount);
  let taxAmount = Number(payload.taxAmount || 0);
  const deliveryFee = Number(payload.deliveryFee || 0);
  const tipAmount = Number(payload.tipAmount || 0);
  const platformFee = Number(payload.platformFee || 0);
  const fulfillmentMethod = payload.fulfillmentMethod === 'delivery' ? 'delivery' : 'pickup';
  const deliveryPartner =
    payload.deliveryPartner || (fulfillmentMethod === 'delivery' ? 'doordash' : null);
  const paymentMethod = payload.paymentMethod || null;

  try {
    const taxResult = await calculateOrderTax({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        country: tenant.country ?? null,
        state: tenant.state ?? null,
        city: tenant.city ?? null,
        postalCode: tenant.postalCode ?? null,
        addressLine1: tenant.addressLine1 ?? null,
        addressLine2: tenant.addressLine2 ?? null,
        integrations: tenant.integrations
          ? {
              taxProvider: tenant.integrations.taxProvider ?? null,
              taxConfig: tenant.integrations.taxConfig ?? null,
              defaultTaxRate: tenant.integrations.defaultTaxRate ?? null,
            }
          : null,
      },
      items: (payload.items ?? []).map((item) => ({
        id: item.menuItemId,
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.price ?? 0),
      })),
      subtotal: subtotalAmount,
      shipping: deliveryFee,
      surcharge: platformFee,
      destination: payload.destination ?? null,
    });
    if (Number.isFinite(taxResult.amount)) {
      taxAmount = Number((taxResult.amount ?? taxAmount).toFixed(2));
    }
  } catch (error) {
    console.warn('[tax] Falling back to provided tax amount', error);
  }

  let customerId: string | null = null;
  let newMemberSessionToken: string | null = null;
  const { customerEmail, customerPhone, customerName } = payload;

  if (customerEmail || customerPhone) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          customerEmail ? { email: customerEmail } : undefined,
          customerPhone ? { phone: customerPhone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // If joining rewards, also initialize loyalty if not already set
      const joinRewards = payload.metadata?.becomeMember === true;
      const updateData: any = {
        name: customerName || existingCustomer.name,
        email: customerEmail || existingCustomer.email,
        phone: customerPhone || existingCustomer.phone,
      };
      // Initialize loyalty for existing customers who are joining rewards
      if (joinRewards && existingCustomer.loyaltyPoints === null) {
        updateData.loyaltyPoints = 0;
        updateData.membershipTier = 'Bronze';
      }
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: updateData,
      });
    } else {
      // Check if customer wants to join rewards program
      const joinRewards = payload.metadata?.becomeMember === true;
      
      const createdCustomer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: customerName || null,
          email: customerEmail || null,
          phone: customerPhone || null,
          loyaltyPoints: joinRewards ? 0 : undefined, // Initialize points if joining
          membershipTier: joinRewards ? 'Bronze' : null, // Set initial tier
        },
      });
      customerId = createdCustomer.id;
    }
    
    // If they're joining rewards (for new or existing customers), create/update customer session
    if (payload.metadata?.becomeMember === true && customerId && (customerEmail || customerPhone)) {
      // Delete old sessions for this customer
      await prisma.customerSession.deleteMany({
        where: {
          tenantId: tenant.id,
          customerId: customerId,
        },
      });

      // Create new session
      newMemberSessionToken = crypto.randomUUID();
      await prisma.customerSession.create({
        data: {
          tenantId: tenant.id,
          customerId: customerId,
          token: newMemberSessionToken,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });
    }
  }

  const order = await prisma.order.create({
    data: {
      subtotalAmount,
      totalAmount,
      taxAmount,
      deliveryFee,
      tipAmount,
      platformFee,
      fulfillmentMethod,
      deliveryPartner,
      paymentMethod,
      customerName: payload.customerName || null,
      customerEmail: payload.customerEmail || null,
      customerPhone: payload.customerPhone || null,
      notes: payload.notes || null,
      scheduledPickupTime: payload.scheduledPickupTime ? new Date(payload.scheduledPickupTime) : null,
      status: 'pending',
      tenantId: tenant.id,
      customerId,
      paymentIntentId: paymentIntentId || null,
    },
  });

  if (Array.isArray(payload.items)) {
    for (const item of payload.items) {
      if (!item?.menuItemId) continue;

      // Check item source based on itemType
      // Grocery/bakery items come from GroceryItem table, food items from MenuItem
      let isValidItem = false;
      let itemName: string | null = null;

      if (item.itemType === 'grocery' || item.itemType === 'bakery') {
        // Validate against GroceryItem table
        const groceryItem = await prisma.groceryItem.findUnique({
          where: { id: item.menuItemId },
          select: { tenantId: true, name: true },
        });
        if (groceryItem && groceryItem.tenantId === tenant.id) {
          isValidItem = true;
          itemName = groceryItem.name;
        }
      } else {
        // Validate against MenuItem table (default for food)
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
          select: { tenantId: true, name: true },
        });
        if (menuItem && menuItem.tenantId === tenant.id) {
          isValidItem = true;
          itemName = menuItem.name;
        }
      }

      if (!isValidItem) continue;

      await prisma.orderItem.create({
        data: {
          menuItemId: item.menuItemId,
          orderId: order.id,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          notes: item.notes || null,
          itemType: item.itemType || null, // Track food/grocery/bakery for fulfillment
          menuItemName: itemName, // Store name for display (supports both MenuItem and GroceryItem)
          tenantId: tenant.id,
        },
      });
    }
  }

  // CRITICAL: Validate that at least one item was created
  // If no items exist, the order is invalid and must be rolled back
  const createdItemCount = await prisma.orderItem.count({
    where: { orderId: order.id },
  });

  if (createdItemCount === 0) {
    // Delete the empty order - this is a critical failure
    await prisma.order.delete({ where: { id: order.id } });
    console.error('[order-service] CRITICAL: Order created with 0 items, rolling back', {
      orderId: order.id,
      payloadItems: payload.items,
      tenantId: tenant.id,
    });
    throw new Error('Order creation failed: No valid items could be added. Please try again or contact support.');
  }

  if (customerId && tenant.settings?.membershipProgram) {
    const program = tenant.settings.membershipProgram as any;
    if (program?.enabled !== false) {
      const rate = Number(program.pointsPerDollar ?? 0);
      if (Number.isFinite(rate) && rate > 0) {
        const pointsEarned = Math.round(totalAmount * rate);
        if (pointsEarned > 0) {
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { loyaltyPoints: true },
          });

          if (customer) {
            const currentPoints = customer.loyaltyPoints ?? 0;
            const newPoints = currentPoints + pointsEarned;
            let membershipTier: string | null = null;

            if (Array.isArray(program.tiers)) {
              const sortedTiers = [...program.tiers].sort((a: any, b: any) => {
                const aOrder = Number.isFinite(a?.sortOrder) ? a.sortOrder : a?.threshold ?? 0;
                const bOrder = Number.isFinite(b?.sortOrder) ? b.sortOrder : b?.threshold ?? 0;
                return aOrder - bOrder;
              });

              const achievedTier = sortedTiers
                .filter((tier: any) => (tier?.threshold ?? 0) <= newPoints)
                .pop();
              if (achievedTier) {
                membershipTier = achievedTier.id || achievedTier.name || null;
              }
            }

            await prisma.customer.update({
              where: { id: customerId },
              data: {
                loyaltyPoints: newPoints,
                membershipTier,
              },
            });
          }
        }
      }
    }
  }

  // Link order to group order if applicable
  if (payload.groupSessionCode) {
    const groupOrder = await prisma.groupOrder.findFirst({
      where: {
        sessionCode: payload.groupSessionCode,
        tenantId: tenant.id,
        status: 'open',
      },
    });

    if (groupOrder) {
      // Update order with group order reference and participant name
      await prisma.order.update({
        where: { id: order.id },
        data: {
          groupOrderId: groupOrder.id,
          participantName: payload.participantName || payload.customerName || null,
        },
      });

      // Update group order aggregates
      await prisma.groupOrder.update({
        where: { id: groupOrder.id },
        data: {
          orderCount: { increment: 1 },
          totalAmount: { increment: totalAmount },
        },
      });

      console.log('[order-service] Order linked to group order', {
        orderId: order.id,
        groupOrderId: groupOrder.id,
        sessionCode: payload.groupSessionCode,
        participantName: payload.participantName,
      });
    }
  }

  const created = await prisma.order.findFirst({
    where: { id: order.id, tenantId: tenant.id },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              section: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      },
      customer: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          contactEmail: true,
          contactPhone: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
    },
  });

  if (!created) {
    throw new Error('Failed to load created order');
  }

  // Map deliveryAddress from payload (either from deliveryAddress or destination field)
  const deliveryAddress = payload.deliveryAddress ?? (payload.destination ? {
    line1: payload.destination.line1 ?? null,
    line2: payload.destination.line2 ?? null,
    city: payload.destination.city ?? null,
    state: payload.destination.state ?? null,
    postalCode: payload.destination.postalCode ?? null,
    instructions: null,
  } : null);

  const serialized = serializeOrder(created, deliveryAddress);
  void autoPrintOrder(serialized, { reason: 'order.created' }).catch((error) => {
    console.error('[printer] Auto-print dispatch failed', error);
  });

  void (async () => {
    try {
      const integration = await prisma.tenantIntegration.findUnique({
        where: { tenantId: tenant.id },
        select: {
          fulfillmentNotificationsEnabled: true,
        },
      });

      if (integration?.fulfillmentNotificationsEnabled === false) {
        return;
      }

      const tenantContact = await prisma.tenant.findUnique({
        where: { id: tenant.id },
        select: {
          name: true,
          contactEmail: true,
          contactPhone: true,
          logoUrl: true,
          primaryColor: true,
          customDomain: true,
        },
      });

      if (!tenantContact) return;

      const targets = {
        email: tenantContact.contactEmail ?? null,
        phone: tenantContact.contactPhone ?? null,
      };

      // Always send customer email even if no fulfillment targets
      const hasTargets = targets.email || targets.phone || serialized.customerEmail;
      if (!hasTargets) return;

      const results = await notifyFulfillmentTeam({
        tenantName: tenantContact.name ?? tenant.slug,
        tenantSlug: tenant.slug,
        targets,
        order: serialized,
        branding: {
          logo: tenantContact.logoUrl,
          primaryColor: tenantContact.primaryColor,
          customDomain: tenantContact.customDomain,
        },
      });

      const allOk =
        (results.email?.ok ?? true) &&
        (results.sms?.ok ?? true) &&
        (results.customerEmail?.ok ?? true);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'fulfillment-notify',
          level: allOk ? 'info' : 'error',
          message: allOk
            ? `Sent notifications for order ${serialized.id.slice(-6)}.`
            : `One or more notifications failed for order ${serialized.id.slice(-6)}.`,
          payload: {
            orderId: serialized.id,
            email: results.email
              ? {
                  ok: results.email.ok,
                  reason:
                    'reason' in results.email && !results.email.ok
                      ? results.email.reason
                      : undefined,
                }
              : null,
            sms: results.sms
              ? {
                  ok: results.sms.ok,
                  reason:
                    'reason' in results.sms && !results.sms.ok
                      ? results.sms.reason
                      : undefined,
                }
              : null,
            customerEmail: results.customerEmail
              ? {
                  ok: results.customerEmail.ok,
                  reason:
                    'reason' in results.customerEmail && !results.customerEmail.ok
                      ? results.customerEmail.reason
                      : undefined,
                }
              : null,
          },
        },
      });
    } catch (error) {
      console.error('[notifications] fulfillment dispatch failed', error);
    }
  })();

  emitOrderEvent({ type: 'order.created', order: serialized });

  // Return order with optional session token for new members
  return {
    ...serialized,
    newMemberSessionToken,
  };
}
