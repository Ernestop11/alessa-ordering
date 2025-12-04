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
      <article className="group flex gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98]">
        {/* Image */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-800">
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
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-500 active:scale-95 disabled:bg-neutral-700 disabled:text-neutral-500"
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
      <article className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10">
        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden bg-neutral-800">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Price badge */}
          <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1">
            <span className="text-lg font-bold text-white">${item.price.toFixed(2)}</span>
          </div>

          {!item.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <span className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-bold text-white/80">SOLD OUT</span>
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
            className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:bg-neutral-700 disabled:text-neutral-500"
          >
            {item.available ? 'Add to Order' : 'Sold Out'}
          </button>
        </div>
      </article>
    );
  }

  // Grid layout (default) - Domino's style card
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 hover:shadow-xl hover:shadow-black/20">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-800">
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
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={isExternalImage || isTenantImage}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Price badge - top right */}
        <div className="absolute top-3 right-3">
          <div className="rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 border border-white/10">
            <span className="text-base font-bold text-white">${item.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Category tag - bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/80 border border-white/10">
            {sectionName}
          </span>
        </div>

        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <span className="rounded-lg bg-neutral-800 px-6 py-3 text-sm font-bold text-white/80 border border-white/10">
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
                className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/40 uppercase tracking-wide"
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
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:bg-neutral-800 disabled:text-neutral-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {item.available ? 'Add to Order' : 'Sold Out'}
        </button>
      </div>
    </article>
  );
}
