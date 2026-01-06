"use client";

import Image from 'next/image';
import { OrderMenuItem } from './OrderPageClient';
import { getStockImageForCategory } from '../../lib/menu-imagery';
import { type TemplateSettings } from '@/lib/template-renderer';

interface MenuItemCardProps {
  item: OrderMenuItem & { displayImage: string };
  sectionName: string;
  sectionType: string;
  layout: 'grid' | 'list' | 'cards';
  onAddToCart: () => void;
  onCustomize: () => void;
  isInCart?: boolean;
  templateSettings?: TemplateSettings;
}

export default function MenuItemCard({
  item,
  sectionName,
  sectionType,
  layout,
  onAddToCart,
  onCustomize,
  isInCart = false,
  templateSettings,
}: MenuItemCardProps) {
  const imageSrc = item.displayImage || getStockImageForCategory(item.category || sectionType, 0);
  const isExternalImage = imageSrc.startsWith('http');
  const isTenantImage = imageSrc.startsWith('/tenant/');

  // List layout - compact horizontal card with bold styling
  if (layout === 'list') {
    return (
      <article className={`group flex gap-4 rounded-2xl p-3 transition-all duration-300 active:scale-[0.99]
        bg-gradient-to-r from-stone-900/95 via-stone-900/90 to-stone-800/80
        border-2 backdrop-blur-xl
        hover:shadow-2xl hover:shadow-red-900/30 hover:-translate-y-0.5
        ${isInCart
          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
          : 'border-red-900/40 hover:border-red-700/60'
        }`}>
        {/* Image with red glow */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-red-900/30 shadow-lg shadow-red-900/20">
          {isExternalImage ? (
            <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = getStockImageForCategory(item.category || sectionType, 0); }} />
          ) : (
            <Image src={imageSrc} alt={item.name} fill className="object-cover" sizes="96px" unoptimized={isExternalImage || isTenantImage} />
          )}
          {item.available && (
            <button onClick={(e) => { e.stopPropagation(); onAddToCart(); }} className="absolute top-1 left-1 w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-400/50 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-red-900/50 hover:scale-110 hover:from-red-500 hover:to-red-600 transition-all" title="Quick add">+</button>
          )}
          {!item.available && <div className="absolute inset-0 flex items-center justify-center bg-black/80"><span className="text-xs font-bold text-red-400">SOLD OUT</span></div>}
        </div>
        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
          <div>
            <h3 className="font-bold text-white text-base leading-tight truncate">{item.name}</h3>
            <p className="mt-1 text-sm text-stone-400 line-clamp-2 leading-snug">{item.description}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">${item.price.toFixed(2)}</span>
            <button onClick={onCustomize} disabled={!item.available} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:shadow-red-800/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100">Customize</button>
          </div>
        </div>
      </article>
    );
  }

  // Cards layout - larger horizontal card
  if (layout === 'cards') {
    return (
      <article className={`group relative overflow-hidden rounded-3xl transition-all duration-500
        bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800
        border-2 backdrop-blur-xl
        hover:shadow-[0_20px_60px_-10px_rgba(185,28,28,0.4)] hover:-translate-y-2
        ${isInCart
          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/30'
          : 'border-red-900/50 hover:border-red-600/70'
        }`}>
        {/* Image with dramatic overlay */}
        <div className="relative h-52 w-full overflow-hidden">
          {isExternalImage ? (
            <img src={imageSrc} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = getStockImageForCategory(item.category || sectionType, 0); }} />
          ) : (
            <Image src={imageSrc} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(min-width: 640px) 50vw, 100vw" unoptimized={isExternalImage || isTenantImage} />
          )}
          {/* Dramatic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Quick Add - Bold red button */}
          {item.available && (
            <button onClick={(e) => { e.stopPropagation(); onAddToCart(); }} className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-400/50 shadow-xl shadow-red-900/50 flex items-center justify-center text-white text-2xl font-bold transition-all duration-300 hover:scale-110 hover:from-red-500 hover:to-red-600 hover:shadow-2xl hover:shadow-red-700/60 active:scale-95" title="Quick add">+</button>
          )}

          {/* Price badge - Gold accent */}
          <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-xl shadow-amber-900/30">
            <span className="text-lg font-black text-stone-900">${item.price.toFixed(2)}</span>
          </div>

          {!item.available && <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"><span className="px-6 py-3 rounded-2xl bg-red-900/80 border border-red-600/50 text-lg font-bold text-white">SOLD OUT</span></div>}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-black text-white leading-tight">{item.name}</h3>
          <p className="mt-2 text-sm text-stone-400 line-clamp-2 leading-relaxed">{item.description}</p>

          <button onClick={onCustomize} disabled={!item.available} className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-red-700 text-white text-base font-bold shadow-xl shadow-red-900/40 transition-all duration-300 hover:from-red-500 hover:via-red-500 hover:to-red-600 hover:shadow-2xl hover:shadow-red-800/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {item.available ? 'Add to Order' : 'Sold Out'}
            </span>
          </button>
        </div>
      </article>
    );
  }

  // Grid layout (default) - STUNNING Mexican-inspired design
  return (
    <article className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500
      bg-gradient-to-br from-stone-900 via-stone-900/95 to-stone-800/90
      border-2 backdrop-blur-xl
      hover:shadow-[0_25px_50px_-12px_rgba(185,28,28,0.5)] hover:-translate-y-2 hover:scale-[1.02]
      ${isInCart
        ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-xl shadow-amber-500/40'
        : 'border-red-900/40 hover:border-red-600/70 shadow-xl shadow-red-950/30'
      }`}>

      {/* Image container with dramatic effects */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {isExternalImage ? (
          <img src={imageSrc} alt={item.name} className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = getStockImageForCategory(item.category || sectionType, 0); }} />
        ) : (
          <Image src={imageSrc} alt={item.name} fill className="object-cover transition-all duration-700 group-hover:scale-110" sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 50vw" unoptimized={isExternalImage || isTenantImage} />
        )}

        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Animated shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>

        {/* Quick Add Button - Bold red circular button */}
        {item.available && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="absolute top-3 left-3 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full
              bg-gradient-to-br from-red-600 to-red-700
              border-2 border-red-400/50
              shadow-lg shadow-red-900/50
              flex items-center justify-center text-white text-xl font-bold
              transition-all duration-300
              hover:scale-110 hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:shadow-red-700/60
              active:scale-95"
            title="Quick add to cart"
          >
            +
          </button>
        )}

        {/* Price badge - Stunning gold gradient */}
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg shadow-amber-900/40 border border-amber-300/30">
            <span className="text-sm sm:text-base font-black text-stone-900">${item.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <span className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-900/90 to-red-800/90 border border-red-600/50 text-sm sm:text-base font-bold text-white shadow-xl">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Content section with refined typography */}
      <div className="p-3 sm:p-5">
        {/* Title with subtle text shadow */}
        <h3 className="text-base sm:text-lg font-black text-white leading-tight line-clamp-2 drop-shadow-sm">
          {item.name}
        </h3>

        {/* Description - desktop only */}
        <p className="hidden sm:block mt-2 text-sm text-stone-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Tags with red/gold theme */}
        {item.tags && item.tags.length > 0 && (
          <div className="hidden sm:flex mt-3 flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-700/40 px-2.5 py-0.5 text-[10px] font-bold text-red-300 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA Button - Bold red gradient with shine effect */}
        <button
          onClick={onCustomize}
          disabled={!item.available}
          className="mt-3 sm:mt-4 w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl
            bg-gradient-to-r from-red-600 via-red-600 to-red-700
            text-white text-sm sm:text-base font-bold
            shadow-lg shadow-red-900/40
            transition-all duration-300
            hover:from-red-500 hover:via-red-500 hover:to-red-600
            hover:shadow-xl hover:shadow-red-800/50
            hover:scale-[1.02]
            active:scale-[0.98]
            disabled:opacity-40 disabled:hover:scale-100
            relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {item.available ? 'Add to Order' : 'Sold Out'}
          </span>
          {/* Button shine effect */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-500" />
          </div>
        </button>
      </div>
    </article>
  );
}
