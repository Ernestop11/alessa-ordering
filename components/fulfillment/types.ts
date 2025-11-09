export type FulfillmentStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | string;

export interface FulfillmentTenant {
  id: string;
  name: string;
  slug: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export interface FulfillmentOrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItemName?: string | null;
}

export interface FulfillmentCustomer {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  loyaltyPoints?: number | null;
}

export interface FulfillmentOrder {
  id: string;
  tenantId: string;
  tenant?: FulfillmentTenant;
  status: FulfillmentStatus;
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
  items: FulfillmentOrderItem[];
  customer?: FulfillmentCustomer | null;
}

export interface FulfillmentEvent {
  type: 'init' | 'order.created' | 'order.updated';
  orders?: FulfillmentOrder[];
  order?: FulfillmentOrder;
}
