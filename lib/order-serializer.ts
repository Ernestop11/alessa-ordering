import type { Order, OrderItem, Customer, Tenant } from '@prisma/client';

export interface SerializedOrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItemName?: string | null;
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
  acknowledgedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: SerializedOrderItem[];
  customer?: SerializedCustomer | null;
}

type OrderWithRelations = Omit<Order, 'acknowledgedAt'> & {
  acknowledgedAt?: Date | null;
  items: Array<
    OrderItem & {
      menuItem?: {
        name: string;
      } | null;
    }
  >;
  customer?: Customer | null;
  tenant?: Pick<Tenant, 'id' | 'name' | 'slug' | 'primaryColor' | 'secondaryColor'> | null;
};

export function serializeOrder(order: OrderWithRelations): SerializedOrder {
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
    acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: Number(item.price ?? 0),
      menuItemName: item.menuItem?.name ?? null,
    })),
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
