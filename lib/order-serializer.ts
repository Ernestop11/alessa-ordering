import type { Order, OrderItem, Customer, Tenant } from '@prisma/client';

// Item types for categorization (matches cart itemType)
export type ItemType = 'food' | 'grocery' | 'bakery';

export interface SerializedOrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItemName?: string | null;
  notes?: string | null; // Item-specific modifiers like "no onions", "extra cheese"
  itemType?: ItemType | null; // food, grocery, or bakery
}

export interface SerializedCustomer {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  loyaltyPoints?: number | null;
}

export interface SerializedTenantInfo {
  id: string;
  name: string;
  slug: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export interface SerializedOrder {
  id: string;
  tenantId: string;
  tenant?: SerializedTenantInfo;
  status: string;
  fulfillmentMethod?: string | null;
  deliveryPartner?: string | null;
  paymentMethod?: string | null;
  subtotalAmount?: number | null;
  totalAmount: number;
  taxAmount?: number | null;
  deliveryFee?: number | null;
  tipAmount?: number | null;
  platformFee?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  scheduledPickupTime?: string | null; // When customer wants to pick up (null = ASAP)
  acknowledgedAt?: string | null;
  deliveryAddress?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    instructions?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  items: SerializedOrderItem[];
  customer?: SerializedCustomer | null;
}

type OrderWithRelations = Omit<Order, 'acknowledgedAt'> & {
  acknowledgedAt?: Date | null;
  items: Array<
    OrderItem & {
      itemType?: string | null; // Stored itemType from order creation
      menuItemName?: string | null; // Denormalized name (works for both MenuItem and GroceryItem)
      menuItem?: {
        name: string;
        section?: {
          type: string;
        } | null;
      } | null;
    }
  >;
  customer?: Customer | null;
  tenant?: Pick<Tenant, 'id' | 'name' | 'slug' | 'primaryColor' | 'secondaryColor'> | null;
};

export function serializeOrder(
  order: OrderWithRelations,
  deliveryAddress?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    instructions?: string | null;
  } | null
): SerializedOrder {
  return {
    id: order.id,
    tenantId: order.tenantId,
    tenant: order.tenant
      ? {
          id: order.tenant.id,
          name: order.tenant.name,
          slug: order.tenant.slug,
          primaryColor: order.tenant.primaryColor,
          secondaryColor: order.tenant.secondaryColor,
        }
      : undefined,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    deliveryPartner: order.deliveryPartner,
    paymentMethod: order.paymentMethod,
    subtotalAmount: order.subtotalAmount ?? null,
    totalAmount: Number(order.totalAmount ?? 0),
    taxAmount: order.taxAmount ?? null,
    deliveryFee: order.deliveryFee ?? null,
    tipAmount: order.tipAmount ?? null,
    platformFee: order.platformFee ?? null,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    notes: order.notes,
    scheduledPickupTime: (order as any).scheduledPickupTime?.toISOString?.() ?? null,
    acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
    deliveryAddress: deliveryAddress ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => {
      // Use stored itemType first (from cart), fallback to section type for legacy orders
      let itemType: ItemType | null = null;
      if (item.itemType === 'grocery' || item.itemType === 'bakery' || item.itemType === 'food') {
        itemType = item.itemType;
      } else {
        // Fallback: derive from menu section type
        const sectionType = item.menuItem?.section?.type;
        if (sectionType === 'GROCERY') itemType = 'grocery';
        else if (sectionType === 'BAKERY') itemType = 'bakery';
        else if (sectionType) itemType = 'food';
      }

      return {
        id: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: Number(item.price ?? 0),
        menuItemName: item.menuItemName ?? item.menuItem?.name ?? null, // Use stored name first, fallback to relation
        notes: item.notes ?? null,
        itemType,
      };
    }),
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          loyaltyPoints: order.customer.loyaltyPoints,
        }
      : null,
  };
}
