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

  // Apple Liquid Glass Button Styles
  const liquidGlassButton = `
    relative overflow-hidden
    rounded-2xl py-3.5 text-sm font-bold
    bg-gradient-to-b from-white/20 to-white/5
    backdrop-blur-xl
    border border-white/20
    shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.1)]
    text-white
    transition-all duration-300 ease-out
    hover:shadow-[0_12px_40px_rgba(196,30,58,0.4),inset_0_1px_0_rgba(255,255,255,0.4)]
    hover:scale-[1.02] hover:border-white/30
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `;

  const quickAddButton = `
    absolute top-3 left-3 z-10
    w-10 h-10 rounded-full
    bg-[#C41E3A]/90 backdrop-blur-md
    border border-white/20
    shadow-lg shadow-[#C41E3A]/30
    flex items-center justify-center
    text-white text-xl font-bold
    transition-all duration-200
    hover:scale-110 hover:bg-[#C41E3A] hover:shadow-xl
    active:scale-95
  `;

  // List layout - compact horizontal card
  if (layout === 'list') {
    return (
      <article className="group flex gap-4 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] p-3 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.99]">
        {/* Image */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a]">
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
          {/* Quick Add */}
          {item.available && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              className="absolute top-1 left-1 w-7 h-7 rounded-full bg-[#C41E3A]/90 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-sm shadow-lg hover:scale-110 transition-transform"
              title="Quick add to cart"
            >
              +
            </button>
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
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-bold text-white shadow-lg hover:from-white/20 hover:to-white/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <span>Customize</span>
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Cards layout - larger horizontal card
  if (layout === 'cards') {
    return (
      <article className="group relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10">
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden bg-[#1a1a1a]">
          {isExternalImage ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 640px) 50vw, 100vw"
              unoptimized={isExternalImage || isTenantImage}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Quick Add Button */}
          {item.available && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              className={quickAddButton}
              title="Quick add to cart"
            >
              +
            </button>
          )}

          {/* Price badge */}
          <div className="absolute top-3 right-3 rounded-xl bg-[#C41E3A]/90 backdrop-blur-sm px-3 py-1.5 border border-white/10">
            <span className="text-lg font-bold text-white">${item.price.toFixed(2)}</span>
          </div>

          {!item.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <span className="rounded-xl bg-[#333] px-4 py-2 text-sm font-bold text-white/80">SOLD OUT</span>
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
            className={`mt-4 w-full flex items-center justify-center gap-2 ${liquidGlassButton}`}
          >
            <span className="relative z-10">{item.available ? 'ADD TO ORDER' : 'Sold Out'}</span>
            {/* Animated shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </article>
    );
  }

  // Grid layout (default) - Compact mobile-first card
  return (
    <article className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] transition-all duration-300 hover:border-[#C41E3A]/40 hover:shadow-xl hover:shadow-[#C41E3A]/10">
      {/* Image container - shorter on mobile */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden bg-[#1a1a1a]">
        {isExternalImage ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 50vw"
            unoptimized={isExternalImage || isTenantImage}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Quick Add Button - smaller on mobile */}
        {item.available && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C41E3A]/90 backdrop-blur-md border border-white/20 shadow-lg shadow-[#C41E3A]/30 flex items-center justify-center text-white text-lg sm:text-xl font-bold transition-all duration-200 hover:scale-110 hover:bg-[#C41E3A] active:scale-95"
            title="Quick add to cart"
          >
            +
          </button>
        )}

        {/* Price badge - top right, smaller on mobile */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <div className="rounded-lg sm:rounded-xl bg-[#C41E3A]/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg border border-white/10">
            <span className="text-sm sm:text-base font-bold text-white">${item.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="rounded-lg sm:rounded-xl bg-[#333] px-4 py-2 text-xs sm:text-sm font-bold text-white/80">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Content - more compact on mobile */}
      <div className="p-2.5 sm:p-4">
        {/* Title - smaller on mobile */}
        <h3 className="text-sm sm:text-lg font-bold text-white leading-tight line-clamp-2 sm:line-clamp-1">{item.name}</h3>

        {/* Description - hidden on mobile, shown on larger screens */}
        <p className="hidden sm:block mt-2 text-sm text-white/50 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Tags - hidden on mobile */}
        {item.tags && item.tags.length > 0 && (
          <div className="hidden sm:flex mt-3 flex-wrap gap-1.5">
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

        {/* Add Button - compact on mobile */}
        <button
          onClick={onCustomize}
          disabled={!item.available}
          className={`mt-2 sm:mt-4 w-full flex items-center justify-center gap-1 sm:gap-2 relative overflow-hidden rounded-lg sm:rounded-2xl py-2 sm:py-3.5 text-xs sm:text-sm font-bold bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] text-white transition-all duration-300 ease-out hover:shadow-[0_8px_24px_rgba(196,30,58,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="relative z-10">{item.available ? 'ADD' : 'Sold Out'}</span>
        </button>
      </div>
    </article>
  );
}
