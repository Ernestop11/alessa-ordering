/**
 * Add-ons Registry
 * Defines available add-ons that can be enabled for tenants
 * Each add-on extends the base restaurant template with additional sections and features
 */

export interface AddOnGradient {
  from: string;
  via: string;
  to: string;
}

export interface AddOn {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: AddOnGradient;
  status: 'active' | 'beta' | 'coming_soon';
  sections: string[];
}

/**
 * Core sections available to all tenants
 */
export const CORE_SECTIONS = [
  'hero',
  'quickInfo',
  'featuredCarousel',
  'menuSections',
  'reviews',
] as const;

/**
 * Restaurant-specific sections (base template)
 */
export const RESTAURANT_SECTIONS = [
  'hero',
  'quickInfo',
  'featuredCarousel',
  'menuSections',
  'reviews',
  'promotional',
] as const;

/**
 * Available add-ons that can be enabled for tenants
 */
export const AVAILABLE_ADDONS: Record<string, AddOn> = {
  grocery: {
    id: 'grocery',
    name: 'Grocery Store',
    icon: '🛒',
    description: 'Mexican grocery with weekend specials and bundles',
    gradient: {
      from: '#059669', // Emerald green
      via: '#10b981', // Green
      to: '#34d399',  // Light green
    },
    status: 'active',
    sections: [
      'weekendSpecials',
      'bundles',
      'groceryBanner',
      'aisles',
    ],
  },
  panaderia: {
    id: 'panaderia',
    name: 'Panadería',
    icon: '🥐',
    description: 'Mexican bakery with daily fresh and box builder',
    gradient: {
      from: '#d97706', // Amber
      via: '#f59e0b', // Orange
      to: '#fbbf24',  // Light orange
    },
    status: 'active',
    sections: [
      'panaderiaBanner',
      'dailyFresh',
      'boxBuilder',
      'categories',
    ],
  },
  juicebar: {
    id: 'juicebar',
    name: 'Juice Bar',
    icon: '🥤',
    description: 'Smoothies and juices with build-your-own',
    gradient: {
      from: '#0891b2', // Cyan
      via: '#06b6d4', // Light cyan
      to: '#22d3ee',  // Sky blue
    },
    status: 'active',
    sections: [
      'buildYourOwn',
      'menuSections',
    ],
  },
  smp: {
    id: 'smp',
    name: 'Switch Menu Pro',
    icon: '📺',
    description: 'Digital signage & TV menu displays with real-time sync',
    gradient: {
      from: '#3b82f6', // Blue
      via: '#6366f1', // Indigo
      to: '#8b5cf6',  // Purple
    },
    status: 'active',
    sections: [
      'digitalMenuDisplay',
      'ordersReadyBoard',
      'promoDisplay',
      'menuSync',
    ],
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory Manager',
    icon: '📦',
    description: 'Track inventory, inter-department transfers, spoilage, and weekly P&L',
    gradient: {
      from: '#7c3aed', // Violet
      via: '#8b5cf6',  // Purple
      to: '#a78bfa',   // Light purple
    },
    status: 'active',
    sections: [
      'inventoryDashboard',
      'departmentOverview',
    ],
  },
  pos: {
    id: 'pos',
    name: 'Store Checkout POS',
    icon: '💳',
    description: 'Simple point-of-sale checkout with cash drawer and shift management',
    gradient: {
      from: '#0284c7', // Sky blue
      via: '#0ea5e9',
      to: '#38bdf8',
    },
    status: 'active',
    sections: [
      'posCheckout',
      'posReports',
    ],
  },
  tax: {
    id: 'tax',
    name: 'Auto Sales Tax',
    icon: '🏛️',
    description: 'Automated sales tax set-aside, filing preparation, and ACH payment to state authorities',
    gradient: {
      from: '#065f46', // Dark emerald
      via: '#059669',  // Emerald
      to: '#10b981',   // Light emerald
    },
    status: 'active',
    sections: [
      'taxDashboard',
      'taxFilings',
      'taxEscrow',
      'taxConfig',
    ],
  },
};

/**
 * Get a specific add-on by ID
 */
export function getAddOn(id: string): AddOn | null {
  return AVAILABLE_ADDONS[id] || null;
}

/**
 * Get all available add-ons
 */
export function getAvailableAddOns(): AddOn[] {
  return Object.values(AVAILABLE_ADDONS);
}

/**
 * Get sections for a specific add-on
 */
export function getAddOnSections(addOnId: string): string[] {
  const addOn = getAddOn(addOnId);
  return addOn ? addOn.sections : [];
}

/**
 * Get all sections for a tenant based on enabled add-ons
 * Combines core sections, restaurant sections, and add-on sections
 */
export function getAllSectionsForTenant(enabledAddOns: string[] = []): string[] {
  // Start with core sections
  const sections = new Set<string>([...CORE_SECTIONS]);
  
  // Add restaurant sections
  RESTAURANT_SECTIONS.forEach(section => sections.add(section));
  
  // Add sections from each enabled add-on
  enabledAddOns.forEach(addOnId => {
    const addOnSections = getAddOnSections(addOnId);
    addOnSections.forEach(section => sections.add(section));
  });
  
  return Array.from(sections);
}

/**
 * Get gradient colors for enabled add-ons
 * Returns the first enabled add-on's gradient, or null
 */
export function getAddOnGradient(enabledAddOns: string[] = []): AddOnGradient | null {
  if (enabledAddOns.length === 0) return null;
  
  const firstAddOn = getAddOn(enabledAddOns[0]);
  return firstAddOn ? firstAddOn.gradient : null;
}

/**
 * Check if an add-on is available (not coming_soon)
 */
export function isAddOnAvailable(addOnId: string): boolean {
  const addOn = getAddOn(addOnId);
  return addOn !== null && addOn.status !== 'coming_soon';
}

