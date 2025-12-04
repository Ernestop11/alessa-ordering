"use client";

import Image from 'next/image';
import { OrderMenuItem } from './OrderPageClient';
import { getStockImageForCategory } from '../../lib/menu-imagery';

interface MenuItemCardProps {
  item: OrderMenuItem & { displayImage: string };
  sectionName: string;
  sectionType: string;
  layout: 'grid' | 'list' | 'cards';
  onAddToCart: () => void;
  onCustomize: () => void;
}

export default function MenuItemCard({
  item,
  sectionName,
  sectionType,
  layout,
  onAddToCart,
  onCustomize,
}: MenuItemCardProps) {
  const imageSrc = item.displayImage || getStockImageForCategory(item.category || sectionType, 0);
  const isExternalImage = imageSrc.startsWith('http');
  const isTenantImage = imageSrc.startsWith('/tenant/');

  // List layout - compact horizontal card
  if (layout === 'list') {
    return (
      <article className="group flex gap-4 rounded-xl bg-[#2a2a2a] border border-white/5 p-3 transition-all duration-200 hover:bg-[#333] active:scale-[0.99]">
        {/* Image */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
          {isExternalImage ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getStockImageForCategory(item.category || sectionType, 0);
              }}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={isExternalImage || isTenantImage}
            />
          )}
          {!item.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <span className="text-xs font-bold text-white/80">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
          <div>
            <h3 className="font-semibold text-white text-base leading-tight truncate">{item.name}</h3>
            <p className="mt-1 text-sm text-white/50 line-clamp-2 leading-snug">{item.description}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-white">${item.price.toFixed(2)}</span>
            <button
              onClick={onCustomize}
              disabled={!item.available}
              className="flex items-center gap-1.5 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#A01830] active:scale-95 disabled:bg-[#444] disabled:text-white/40"
            >
              <span>+</span>
              <span>Add</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Cards layout - larger horizontal card
  if (layout === 'cards') {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-[#2a2a2a] border border-white/5 transition-all duration-200 hover:bg-[#333]">
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden bg-[#1a1a1a]">
          {isExternalImage ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getStockImageForCategory(item.category || sectionType, 0);
              }}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 640px) 50vw, 100vw"
              unoptimized={isExternalImage || isTenantImage}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Price badge */}
          <div className="absolute top-3 right-3 rounded-lg bg-[#C41E3A] px-3 py-1">
            <span className="text-lg font-bold text-white">${item.price.toFixed(2)}</span>
          </div>

          {!item.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <span className="rounded-lg bg-[#333] px-4 py-2 text-sm font-bold text-white/80">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
          <p className="mt-2 text-sm text-white/50 line-clamp-2 leading-relaxed">{item.description}</p>

          <button
            onClick={onCustomize}
            disabled={!item.available}
            className="mt-4 w-full rounded-lg bg-[#C41E3A] py-3 text-sm font-bold text-white transition-all hover:bg-[#A01830] active:scale-[0.98] disabled:bg-[#444] disabled:text-white/40"
          >
            {item.available ? 'ADD TO ORDER' : 'Sold Out'}
          </button>
        </div>
      </article>
    );
  }

  // Grid layout (default) - Panda Express style card
  return (
    <article className="group relative overflow-hidden rounded-xl bg-[#2a2a2a] border border-white/5 transition-all duration-200 hover:border-[#C41E3A]/30 hover:shadow-lg hover:shadow-[#C41E3A]/5">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1a1a1a]">
        {isExternalImage ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getStockImageForCategory(item.category || sectionType, 0);
            }}
          />
        ) : (
          <Image
            src={imageSrc}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={isExternalImage || isTenantImage}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Price badge - top right */}
        <div className="absolute top-3 right-3">
          <div className="rounded-lg bg-[#C41E3A] px-3 py-1.5 shadow-lg">
            <span className="text-base font-bold text-white">${item.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="rounded-lg bg-[#333] px-6 py-3 text-sm font-bold text-white/80">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-white leading-tight line-clamp-1">{item.name}</h3>

        {/* Description */}
        <p className="mt-2 text-sm text-white/50 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {item.description}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#C41E3A]/10 border border-[#C41E3A]/20 px-2 py-0.5 text-[10px] font-medium text-[#C41E3A] uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Add button */}
        <button
          onClick={onCustomize}
          disabled={!item.available}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-[#C41E3A] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#A01830] active:scale-[0.98] disabled:bg-[#444] disabled:text-white/40"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {item.available ? 'ADD TO ORDER' : 'Sold Out'}
        </button>
      </div>
    </article>
  );
}
