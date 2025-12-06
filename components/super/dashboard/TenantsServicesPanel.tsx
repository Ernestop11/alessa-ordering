"use client";

import { useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  monthlyFee: number;
}

interface TenantProduct {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  productId: string;
  productName: string;
  productSlug: string;
  productType: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  monthlyPrice: number;
  icon: string | null;
  color: string | null;
  subscriberCount: number;
}

interface Props {
  tenants: Tenant[];
  tenantProducts: TenantProduct[];
  products: Product[];
  onTenantClick?: (tenantId: string) => void;
}

export default function TenantsServicesPanel({ tenants, tenantProducts, products, onTenantClick }: Props) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const getTenantProducts = (tenantId: string) => {
    return tenantProducts.filter((tp) => tp.tenantId === tenantId);
  };

  const getServiceBadge = (productSlug: string) => {
    const product = products.find((p) => p.slug === productSlug);
    if (!product) return null;
    return {
      icon: product.icon || '📦',
      color: product.color || '#6b7280',
      name: product.name,
    };
  };

  const serviceAdoption = products.map((product) => ({
    ...product,
    tenantCount: tenantProducts.filter((tp) => tp.productSlug === product.slug).length,
  }));

  return (
    <div className="space-y-6">
      {/* Active Tenants List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Active Tenants</h3>
        <div className="space-y-2">
          {tenants.map((tenant) => {
            const tenantServices = getTenantProducts(tenant.id);
            return (
              <div
                key={tenant.id}
                onClick={() => {
                  setSelectedTenantId(tenant.id);
                  onTenantClick?.(tenant.id);
                }}
                className={`group cursor-pointer rounded-xl border p-4 transition ${
                  selectedTenantId === tenant.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{tenant.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tenant.status === 'LIVE'
                            ? 'bg-green-100 text-green-700'
                            : tenant.status === 'PENDING_REVIEW'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">${tenant.monthlyFee}/mo</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tenantServices.map((service) => {
                      const badge = getServiceBadge(service.productSlug);
                      if (!badge) return null;
                      return (
                        <span
                          key={service.id}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                          style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                          title={badge.name}
                        >
                          {badge.icon}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {tenants.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              No tenants yet
            </p>
          )}
        </div>
      </div>

      {/* Services Overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Service Adoption</h3>
        <div className="space-y-3">
          {serviceAdoption.map((service) => (
            <div key={service.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.subscriberCount} subscribers</p>
                </div>
              </div>
              <div className="flex-1 px-4">
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(service.tenantCount / Math.max(tenants.length, 1)) * 100}%`,
                      backgroundColor: service.color || '#6b7280',
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-700">{service.tenantCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

