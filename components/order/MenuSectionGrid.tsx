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
    ? 'grid gap-6 sm:gap-8 sm:grid-cols-2 xl:grid-cols-3' 
    : layout === 'list'
    ? 'space-y-4'
    : 'grid gap-6 sm:grid-cols-2';

  return (
    <section 
      id={`section-${section.id}`}
      className="scroll-mt-32 space-y-8 rounded-3xl p-8 transition-all mb-8 bg-white/5 border border-white/10"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] mb-2 text-white/50">
            {section.type === 'RESTAURANT' ? '🌮' : 
             section.type === 'BAKERY' ? '🥐' :
             section.type === 'BEVERAGE' ? '🥤' :
             section.type === 'GROCERY' ? '🛒' : '🍽️'} {section.type}
          </p>
          <h2 className="text-4xl font-black mb-2 text-white">{section.name}</h2>
          {section.description && (
            <p className="text-sm text-white/60 mt-2">{section.description}</p>
          )}
        </div>
        <span className="rounded-full border-2 px-5 py-2.5 text-sm font-black shadow-lg border-white/10 bg-white/5 text-white/70">
          {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
        </span>
      </header>

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

