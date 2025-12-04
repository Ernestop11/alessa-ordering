"use client";

import { OrderMenuSection, OrderMenuItem } from './OrderPageClient';
import MenuItemCard from './MenuItemCard';

interface MenuSectionGridProps {
  section: OrderMenuSection;
  layout: 'grid' | 'list' | 'cards';
  onAddToCart: (item: OrderMenuItem, image?: string) => void;
  onCustomize: (item: OrderMenuItem & { displayImage: string }, sectionType: string) => void;
}

export default function MenuSectionGrid({
  section,
  layout,
  onAddToCart,
  onCustomize,
}: MenuSectionGridProps) {
  const gridClass = layout === 'grid'
    ? 'grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : layout === 'list'
    ? 'flex flex-col gap-3'
    : 'grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2';

  // Header is now rendered by parent component with varied styles
  return (
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
  );
}
