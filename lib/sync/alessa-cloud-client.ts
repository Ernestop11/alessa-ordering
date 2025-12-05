/**
 * Alessa Cloud API Client
 * Used by SMP and other ecosystem products to sync with Alessa Cloud
 */

const BASE_URL = process.env.ALESSACLOUD_BASE_URL || 'https://alessacloud.com/api';
const API_KEY = process.env.ALESSACLOUD_API_KEY;

if (!API_KEY) {
  console.warn('[AlessaCloudClient] ALESSACLOUD_API_KEY not configured');
}

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export interface TenantServices {
  tenantId: string;
  tenantSlug: string;
  services: {
    ordering: boolean;
    digitalMenu: boolean;
    catering: boolean;
    smp: boolean;
  };
}

export interface MenuProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  gallery?: any;
  available: boolean;
  menuSectionId?: string | null;
  timeSpecificEnabled: boolean;
  timeSpecificDays: number[];
  timeSpecificStartTime?: string | null;
  timeSpecificEndTime?: string | null;
  timeSpecificPrice?: number | null;
  timeSpecificLabel?: string | null;
  isFeatured: boolean;
  tags: string[];
  customizationRemovals: string[];
  customizationAddons?: any;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  position: number;
  hero: boolean;
  itemCount: number;
}

class AlessaCloudClient {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || BASE_URL;
    this.apiKey = apiKey || API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getTenantBySlug(slug: string): Promise<TenantInfo> {
    return this.request<TenantInfo>(`/sync/tenants/${slug}`);
  }

  async getTenantServices(tenantId: string): Promise<TenantServices> {
    return this.request<TenantServices>(`/sync/tenants/${tenantId}/services`);
  }

  async getProducts(tenantId: string): Promise<MenuProduct[]> {
    return this.request<MenuProduct[]>(`/sync/ordering/${tenantId}/products`);
  }

  async getCategories(tenantId: string): Promise<MenuCategory[]> {
    return this.request<MenuCategory[]>(`/sync/ordering/${tenantId}/categories`);
  }

  async updateProduct(tenantId: string, productId: string, data: Partial<MenuProduct>): Promise<MenuProduct> {
    return this.request<MenuProduct>(`/sync/ordering/${tenantId}/products`, {
      method: 'POST',
      body: JSON.stringify({ id: productId, ...data }),
    });
  }
}

export default AlessaCloudClient;

