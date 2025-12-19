'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle2, Circle, TrendingUp, Code, Wrench, DollarSign } from 'lucide-react';

interface ProductFeature {
  id: string;
  name: string;
  status: 'implemented' | 'partial' | 'planned' | 'missing';
  description?: string;
}

interface ProductTool {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'payment' | 'integration';
  status: 'active' | 'planned';
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'core' | 'addon' | 'premium';
  icon: string;
  color: string;
  monthlyPrice: number;
  marketValue: number; // Estimated market value
  techStack: string[];
  features: ProductFeature[];
  tools: ProductTool[];
  subscriberCount: number;
  tenantIds: string[];
}

interface Props {
  tenantId?: string;
  onProductClick?: (productId: string) => void;
  onTenantClick?: (tenantId: string) => void;
}

// Product definitions with full details
const PRODUCT_DEFINITIONS: Omit<Product, 'subscriberCount' | 'tenantIds'>[] = [
  {
    id: 'alessa-ordering',
    name: 'Alessa Ordering',
    slug: 'alessa-ordering',
    description: 'Complete online ordering system for restaurants with menu management, cart, checkout, and payment processing',
    category: 'core',
    icon: '🍽️',
    color: '#3b82f6',
    monthlyPrice: 99,
    marketValue: 50000,
    techStack: ['Next.js 14', 'React', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe', 'NextAuth'],
    features: [
      { id: 'menu-management', name: 'Menu Management', status: 'implemented', description: 'Full CRUD for menu sections and items' },
      { id: 'shopping-cart', name: 'Shopping Cart', status: 'implemented', description: 'Real-time cart with customization options' },
      { id: 'checkout-flow', name: 'Checkout Flow', status: 'implemented', description: 'Multi-step checkout with payment processing' },
      { id: 'payment-processing', name: 'Payment Processing', status: 'implemented', description: 'Stripe Connect integration with platform fees' },
      { id: 'order-fulfillment', name: 'Order Fulfillment', status: 'implemented', description: 'Real-time order dashboard with status tracking' },
      { id: 'customer-portal', name: 'Customer Portal', status: 'implemented', description: 'Order history and account management' },
      { id: 'multi-tenant', name: 'Multi-Tenant Architecture', status: 'implemented', description: 'Complete tenant isolation and branding' },
      { id: 'mobile-responsive', name: 'Mobile Responsive', status: 'implemented', description: 'Fully responsive design for all devices' },
      { id: 'analytics', name: 'Analytics Dashboard', status: 'partial', description: 'Basic metrics, needs advanced analytics' },
      { id: 'inventory', name: 'Inventory Management', status: 'missing', description: 'Stock tracking and low stock alerts' },
      { id: 'discounts', name: 'Discount Codes', status: 'missing', description: 'Promo codes and discount management' },
      { id: 'scheduled-orders', name: 'Scheduled Orders', status: 'missing', description: 'Allow customers to schedule future orders' },
    ],
    tools: [
      { id: 'stripe', name: 'Stripe', category: 'payment', status: 'active' },
      { id: 'nextauth', name: 'NextAuth', category: 'backend', status: 'active' },
      { id: 'prisma', name: 'Prisma', category: 'database', status: 'active' },
      { id: 'postgresql', name: 'PostgreSQL', category: 'database', status: 'active' },
      { id: 'pm2', name: 'PM2', category: 'infrastructure', status: 'active' },
      { id: 'nginx', name: 'Nginx', category: 'infrastructure', status: 'active' },
      { id: 'doordash', name: 'DoorDash API', category: 'integration', status: 'planned' },
      { id: 'taxjar', name: 'TaxJar', category: 'integration', status: 'planned' },
    ],
  },
  {
    id: 'alessa-fulfillment',
    name: 'Alessa Fulfillment',
    slug: 'alessa-fulfillment',
    description: 'Advanced fulfillment management with printer integration, notifications, and real-time updates',
    category: 'addon',
    icon: '📦',
    color: '#10b981',
    monthlyPrice: 29,
    marketValue: 15000,
    techStack: ['React', 'Server-Sent Events', 'Bluetooth API', 'WebSocket'],
    features: [
      { id: 'fulfillment-board', name: 'Fulfillment Board', status: 'implemented', description: 'Kanban-style order management' },
      { id: 'printer-integration', name: 'Printer Integration', status: 'partial', description: 'Bluetooth printer support (needs testing)' },
      { id: 'notifications', name: 'Real-time Notifications', status: 'partial', description: 'SSE implemented, needs SMS/Email providers' },
      { id: 'order-tracking', name: 'Order Tracking', status: 'implemented', description: 'Status updates and timeline' },
      { id: 'auto-print', name: 'Auto-Print Orders', status: 'implemented', description: 'Automatic printing on new orders' },
      { id: 'delivery-tracking', name: 'Delivery Tracking', status: 'missing', description: 'Real-time delivery location tracking' },
    ],
    tools: [
      { id: 'sse', name: 'Server-Sent Events', category: 'backend', status: 'active' },
      { id: 'bluetooth', name: 'Bluetooth API', category: 'integration', status: 'partial' },
      { id: 'twilio', name: 'Twilio', category: 'integration', status: 'planned' },
      { id: 'sendgrid', name: 'SendGrid', category: 'integration', status: 'planned' },
    ],
  },
  {
    id: 'alessa-crm',
    name: 'Alessa CRM',
    slug: 'alessa-crm',
    description: 'Customer relationship management with lead tracking, pipeline, and MLM integration',
    category: 'addon',
    icon: '💼',
    color: '#8b5cf6',
    monthlyPrice: 49,
    marketValue: 25000,
    techStack: ['React', 'Prisma', 'PostgreSQL'],
    features: [
      { id: 'lead-tracking', name: 'Lead Tracking', status: 'implemented', description: 'Track leads through pipeline stages' },
      { id: 'pipeline', name: 'Sales Pipeline', status: 'implemented', description: 'Visual pipeline with stages' },
      { id: 'mlm-integration', name: 'MLM Integration', status: 'implemented', description: 'Multi-level marketing tree structure' },
      { id: 'contact-management', name: 'Contact Management', status: 'partial', description: 'Basic contact info, needs enrichment' },
      { id: 'email-tracking', name: 'Email Tracking', status: 'missing', description: 'Email open and click tracking' },
      { id: 'automation', name: 'Marketing Automation', status: 'missing', description: 'Automated email sequences' },
    ],
    tools: [
      { id: 'prisma', name: 'Prisma', category: 'database', status: 'active' },
      { id: 'postgresql', name: 'PostgreSQL', category: 'database', status: 'active' },
      { id: 'mailchimp', name: 'Mailchimp', category: 'integration', status: 'planned' },
    ],
  },
  {
    id: 'alessa-analytics',
    name: 'Alessa Analytics',
    slug: 'alessa-analytics',
    description: 'Advanced analytics and reporting with revenue insights, customer behavior, and performance metrics',
    category: 'premium',
    icon: '📊',
    color: '#f59e0b',
    monthlyPrice: 79,
    marketValue: 30000,
    techStack: ['React', 'Chart.js', 'PostgreSQL'],
    features: [
      { id: 'revenue-dashboard', name: 'Revenue Dashboard', status: 'partial', description: 'Basic revenue metrics, needs advanced charts' },
      { id: 'customer-insights', name: 'Customer Insights', status: 'missing', description: 'Customer behavior and segmentation' },
      { id: 'sales-reports', name: 'Sales Reports', status: 'partial', description: 'Basic reports, needs export functionality' },
      { id: 'predictive-analytics', name: 'Predictive Analytics', status: 'missing', description: 'Forecasting and predictions' },
    ],
    tools: [
      { id: 'chartjs', name: 'Chart.js', category: 'frontend', status: 'planned' },
      { id: 'postgresql', name: 'PostgreSQL', category: 'database', status: 'active' },
    ],
  },
];

export default function EnhancedProductsTab({ tenantId, onProductClick, onTenantClick }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [filterCategory, setFilterCategory] = useState<'all' | 'core' | 'addon' | 'premium'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch actual product data from API
      const response = await fetch('/api/super/products');
      if (response.ok) {
        const data = await response.json();
        const apiProducts = data.products || [];
        
        // Merge with definitions
        const mergedProducts: Product[] = PRODUCT_DEFINITIONS.map((def) => {
          const apiProduct = apiProducts.find((p: any) => p.slug === def.slug);
          return {
            ...def,
            subscriberCount: apiProduct?.subscriptionCount || 0,
            tenantIds: apiProduct?.tenantIds || [],
          };
        });
        
        setProducts(mergedProducts);
      } else {
        // Fallback to definitions only
        setProducts(PRODUCT_DEFINITIONS.map((def) => ({
          ...def,
          subscriberCount: 0,
          tenantIds: [],
        })));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Fallback to definitions
      setProducts(PRODUCT_DEFINITIONS.map((def) => ({
        ...def,
        subscriberCount: 0,
        tenantIds: [],
      })));
    } finally {
      setLoading(false);
    }
  };

  const getFeatureStatusIcon = (status: ProductFeature['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Circle className="h-4 w-4 text-yellow-600" />;
      case 'planned':
        return <Circle className="h-4 w-4 text-blue-600" />;
      case 'missing':
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFeatureStatusColor = (status: ProductFeature['status']) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'planned':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'missing':
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getToolCategoryColor = (category: ProductTool['category']) => {
    const colors = {
      frontend: 'bg-purple-100 text-purple-700',
      backend: 'bg-blue-100 text-blue-700',
      database: 'bg-green-100 text-green-700',
      infrastructure: 'bg-orange-100 text-orange-700',
      payment: 'bg-pink-100 text-pink-700',
      integration: 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const filteredProducts = products.filter((p) => 
    filterCategory === 'all' || p.category === filterCategory
  );

  const implementedCount = (product: Product) => 
    product.features.filter((f) => f.status === 'implemented').length;
  const totalFeatures = product.features.length;
  const completionPercentage = (implementedCount(product) / totalFeatures) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Products Ecosystem</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visual audit of all products with tech stack, features, market value, and tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="core">Core Products</option>
            <option value="addon">Add-ons</option>
            <option value="premium">Premium</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'tree' : 'grid')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {viewMode === 'grid' ? '🌳 Tree View' : '📊 Grid View'}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`group relative overflow-hidden rounded-2xl border-2 bg-white shadow-lg transition-all hover:shadow-xl ${
              selectedProduct === product.id
                ? 'border-blue-500 ring-4 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Product Header */}
            <div
              className="p-6 text-white"
              style={{ backgroundColor: product.color }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{product.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{product.category.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${
                      selectedProduct === product.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm opacity-90">{product.description}</p>
            </div>

            {/* Product Stats */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Market Value</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    ${(product.marketValue / 1000).toFixed(0)}k
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Subscribers</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {product.subscriberCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Price</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    ${product.monthlyPrice}/mo
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Completion</p>
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${completionPercentage}%`,
                            backgroundColor: product.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {Math.round(completionPercentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedProduct === product.id && (
              <div className="p-6 space-y-6 bg-gray-50">
                {/* Tech Stack */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Tech Stack</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Features</h4>
                    <span className="ml-auto text-xs text-gray-500">
                      {implementedCount(product)}/{totalFeatures} implemented
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {product.features.map((feature) => (
                      <div
                        key={feature.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getFeatureStatusColor(
                          feature.status
                        )}`}
                      >
                        {getFeatureStatusIcon(feature.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{feature.name}</p>
                          {feature.description && (
                            <p className="text-xs opacity-75 mt-1">{feature.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Tools & Integrations</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.tools.map((tool) => (
                      <span
                        key={tool.id}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tool.status === 'active'
                            ? getToolCategoryColor(tool.category)
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                        title={tool.category}
                      >
                        {tool.name}
                        {tool.status === 'planned' && ' (planned)'}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Market Value */}
                <div className="flex items-center gap-2 p-4 bg-white rounded-lg border border-gray-200">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Market Value</p>
                    <p className="text-xs text-gray-500">
                      Estimated development value: ${product.marketValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onProductClick?.(product.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Details
                  </button>
                  {product.tenantIds.length > 0 && (
                    <button
                      onClick={() => {
                        // Show tenants using this product
                        console.log('Tenants:', product.tenantIds);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      {product.tenantIds.length} Tenant{product.tenantIds.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Subscribers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {products.reduce((sum, p) => sum + p.subscriberCount, 0)}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Market Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${(products.reduce((sum, p) => sum + p.marketValue, 0) / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Completion</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Math.round(
              products.reduce((sum, p) => sum + (implementedCount(p) / p.features.length) * 100, 0) /
                products.length
            )}%
          </p>
        </div>
      </div>
    </div>
  );
}

