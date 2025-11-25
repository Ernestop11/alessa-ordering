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

  if (layout === 'list') {
    return (
      <article className="group flex gap-4 rounded-2xl bg-white/8 p-4 shadow-xl shadow-black/10 backdrop-blur-md transition hover:bg-white/12 hover:shadow-xl hover:shadow-red-600/20">
        <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800 to-gray-900">
          {isExternalImage ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
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
              className="object-cover transition-transform group-hover:scale-110"
              sizes="112px"
              unoptimized={isExternalImage || isTenantImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getStockImageForCategory(item.category || sectionType, 0);
              }}
            />
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                ${item.price.toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/70 line-clamp-2">{item.description}</p>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              className="flex-1 rounded-lg bg-[#ff0000] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#ff0000]/30 transition-all hover:scale-[1.02] hover:shadow-[#ff0000]/50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onCustomize}
              disabled={!item.available}
            >
              {item.available ? 'Add to Cart' : 'Sold Out'}
            </button>
            <button
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onAddToCart}
              disabled={!item.available}
            >
              Quick Add
            </button>
          </div>
        </div>
      </article>
    );
  }

  if (layout === 'cards') {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-white/20">
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {isExternalImage ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
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
              className="object-cover transition duration-500 group-hover:scale-110"
              sizes="(min-width: 1024px) 480px, 100vw"
              unoptimized={isExternalImage || isTenantImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getStockImageForCategory(item.category || sectionType, 0);
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <span className="text-3xl">🌮</span>
            <div className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
              {sectionName}
            </div>
          </div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold text-white">{item.name}</h3>
            <span className="rounded-full bg-white/10 px-4 py-1 text-lg font-bold text-white">
              ${item.price.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-white/70 line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <button
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
              onClick={onCustomize}
              disabled={!item.available}
            >
              Add to Cart
            </button>
            <button
              className="rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-105 hover:shadow-lg"
              onClick={onAddToCart}
              disabled={!item.available}
            >
              {item.available ? 'Quick Add' : 'Sold Out'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Grid layout (default)
  return (
    <article className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-white/10 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-2xl hover:border-white/30 hover:shadow-red-600/30">
      <div className="relative h-56 w-full overflow-hidden sm:h-64 bg-gradient-to-br from-gray-800 to-gray-900">
        {isExternalImage ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 280px, 100vw"
            unoptimized={isExternalImage || isTenantImage}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getStockImageForCategory(item.category || sectionType, 0);
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <span className="text-3xl drop-shadow-lg">🌮</span>
          <span className="rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm border-white/30 bg-black/60 text-white">
            {sectionName}
          </span>
        </div>
      </div>
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-white">{item.name}</h3>
          <span className="text-2xl font-black text-rose-200">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm leading-relaxed line-clamp-3 text-white/80">{item.description}</p>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/20 px-2 py-1 text-white/60">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] hover:shadow-rose-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCustomize}
            disabled={!item.available}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {item.available ? 'Add to Cart' : 'Sold Out'}
            </span>
          </button>
          <button
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAddToCart}
            disabled={!item.available}
          >
            Quick Add
          </button>
        </div>
      </div>
    </article>
  );
}

