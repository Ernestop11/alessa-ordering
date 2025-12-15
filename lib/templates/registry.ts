export type TemplateType = 'restaurant' | 'grocery' | 'panaderia' | 'coffee' | 'juice';

export interface TemplateGradient {
  from: string;
  via: string;
  to: string;
}

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  icon: string;
  description: string;
  gradient: TemplateGradient;
  sections: string[];
}

export const TEMPLATES: Record<TemplateType, TemplateConfig> = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Taqueria, kitchen ordering with modifiers',
    gradient: { from: '#dc2626', via: '#ea580c', to: '#facc15' },
    sections: ['hero', 'quickInfo', 'featuredCarousel', 'menuSections', 'reviews', 'promotional'],
  },
  grocery: {
    id: 'grocery',
    name: 'Grocery Store',
    icon: '🛒',
    description: 'Mexican grocery with weekend specials and bundles',
    gradient: { from: '#059669', via: '#10b981', to: '#34d399' },
    sections: ['hero', 'quickInfo', 'featuredCarousel', 'weekendSpecials', 'bundles', 'groceryBanner', 'aisles'],
  },
  panaderia: {
    id: 'panaderia',
    name: 'Panadería',
    icon: '🥐',
    description: 'Mexican bakery with daily fresh and box builder',
    gradient: { from: '#d97706', via: '#f59e0b', to: '#fbbf24' },
    sections: ['hero', 'quickInfo', 'featuredCarousel', 'dailyFresh', 'boxBuilder', 'categories'],
  },
  coffee: {
    id: 'coffee',
    name: 'Coffee Bar',
    icon: '☕',
    description: 'Coffee shop with drink customizations',
    gradient: { from: '#78350f', via: '#92400e', to: '#b45309' },
    sections: ['hero', 'quickInfo', 'featuredCarousel', 'menuSections', 'customizations'],
  },
  juice: {
    id: 'juice',
    name: 'Juice Bar',
    icon: '🥤',
    description: 'Smoothies and juices with build-your-own',
    gradient: { from: '#0891b2', via: '#06b6d4', to: '#22d3ee' },
    sections: ['hero', 'quickInfo', 'featuredCarousel', 'buildYourOwn', 'menuSections'],
  },
};

export function getTemplate(type: TemplateType): TemplateConfig {
  return TEMPLATES[type] || TEMPLATES.restaurant;
}

export function getTemplateGradient(type: TemplateType): TemplateGradient {
  return getTemplate(type).gradient;
}

export function getTemplateSections(type: TemplateType): string[] {
  return getTemplate(type).sections;
}

export function getGradientCSS(gradient: TemplateGradient): string {
  return `linear-gradient(135deg, ${gradient.from}, ${gradient.via}, ${gradient.to})`;
}

