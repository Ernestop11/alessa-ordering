"use client";

import { OrderMenuSection, OrderMenuItem } from './OrderPageClient';
import MenuItemCard from './MenuItemCard';

interface MenuSectionGridProps {
  section: OrderMenuSection;
  layout: 'grid' | 'list' | 'cards';
  onAddToCart: (item: OrderMenuItem, image?: string) => void;
  onCustomize: (item: OrderMenuItem & { displayImage: string }, sectionType: string) => void;
}

const SECTION_ICONS: Record<string, string> = {
  RESTAURANT: '🌮',
  BAKERY: '🥐',
  BEVERAGE: '🥤',
  GROCERY: '🛒',
  SPECIAL: '⭐',
  OTHER: '🍽️',
};

export default function MenuSectionGrid({
  section,
  layout,
  onAddToCart,
  onCustomize,
}: MenuSectionGridProps) {
  const icon = SECTION_ICONS[section.type] || '🍽️';

  const gridClass = layout === 'grid'
    ? 'grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : layout === 'list'
    ? 'flex flex-col gap-3'
    : 'grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2';

  return (
    <section
      id={`section-${section.id}`}
      className="scroll-mt-32 mb-8"
    >
      {/* Section Header */}
      <header className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{section.name}</h2>
            <span className="text-sm text-white/40">
              {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
        {section.description && (
          <p className="text-sm text-white/50 pl-10">{section.description}</p>
        )}
      </header>

      {/* Items Grid */}
      <div className={gridClass}>
        {section.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item as OrderMenuItem & { displayImage: string }}
            sectionName={section.name}
            sectionType={section.type}
            layout={layout}
            onAddToCart={() => onAddToCart(item, item.displayImage || item.image || undefined)}
            onCustomize={() => onCustomize(item as OrderMenuItem & { displayImage: string }, section.type)}
          />
        ))}
      </div>
    </section>
  );
}
