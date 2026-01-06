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

  // Check if item has spicy tag
  const isSpicy = item.tags?.some(t => t.toLowerCase().includes('spicy') || t.toLowerCase().includes('hot'));
  const isPopular = item.tags?.some(t => t.toLowerCase().includes('popular') || t.toLowerCase().includes('favorite'));

  // List layout - Napa-worthy horizontal card
  if (layout === 'list') {
    return (
      <article className={`group flex gap-4 rounded-2xl p-4 transition-all duration-500
        bg-gradient-to-r from-[#1a0a0a] via-[#1a1010] to-[#1a0a0a]
        border-2 backdrop-blur-xl mexican-pattern
        hover:shadow-[0_20px_60px_-15px_rgba(220,38,38,0.4)] hover:-translate-y-1
        ${isInCart
          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/30 animate-warm-glow'
          : 'border-red-900/30 hover:border-red-600/60'
        }`}>
        {/* Image with sizzle effect */}
        <div className={`relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl shadow-xl ${isSpicy ? 'animate-sizzle' : ''}`}>
          {isExternalImage ? (
            <img src={imageSrc} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = getStockImageForCategory(item.category || sectionType, 0); }} />
          ) : (
            <Image src={imageSrc} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="112px" unoptimized={isExternalImage || isTenantImage} />
          )}
          {/* Steam effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {item.available && (
            <button onClick={(e) => { e.stopPropagation(); onAddToCart(); }} className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 border-2 border-amber-400/50 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-red-900/50 hover:scale-110 hover:from-red-500 transition-all btn-fire" title="Quick add">+</button>
          )}
          {!item.available && <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"><span className="text-xs font-black text-red-400 uppercase tracking-wider">Sold Out</span></div>}
          {isSpicy && <div className="absolute top-2 right-2 text-lg spicy-indicator">🌶️</div>}
        </div>
        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-lg leading-tight truncate">{item.name}</h3>
              {isPopular && <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[10px] font-black text-black uppercase">Popular</span>}
            </div>
            <p className="mt-1 text-sm text-stone-400 line-clamp-2 leading-snug">{item.description}</p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-black gradient-gold-text">${item.price.toFixed(2)}</span>
            <button onClick={onCustomize} disabled={!item.available} className="px-5 py-2.5 rounded-xl btn-fire text-white text-sm font-black shadow-lg shadow-red-900/50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100">
              Customize
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Cards layout - Premium Napa restaurant style
  if (layout === 'cards') {
    return (
      <article className={`premium-card group relative overflow-hidden rounded-3xl transition-all duration-500
        ${isInCart
          ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-2xl shadow-amber-500/30'
          : ''
        }`}>
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 ambiance-overlay pointer-events-none" />

        {/* Image with cinematic effects */}
        <div className={`relative h-56 w-full overflow-hidden ${isSpicy ? 'animate-sizzle' : ''}`}>
          {isExternalImage ? (
            <img src={imageSrc} alt={item.name} className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" onError={(e) => { (e.target as HTMLImageElement).src = getStockImageForCategory(item.category || sectionType, 0); }} />
          ) : (
            <Image src={imageSrc} alt={item.name} fill className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" sizes="(min-width: 640px) 50vw, 100vw" unoptimized={isExternalImage || isTenantImage} />
          )}

          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Quick Add - Premium style */}
          {item.available && (
            <button onClick={(e) => { e.stopPropagation(); onAddToCart(); }} className="absolute top-4 left-4 z-10 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-2 border-amber-400/50 shadow-2xl shadow-red-900/60 flex items-center justify-center text-white text-2xl font-black transition-all duration-300 hover:scale-110 hover:from-red-500 hover:border-amber-400 active:scale-95 btn-fire" title="Quick add">+</button>
          )}

          {/* Price badge - Gold luxury */}
          <div className="absolute top-4 right-4 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-2xl shadow-amber-900/50 border border-amber-200/30">
            <span className="text-xl font-black text-stone-900">${item.price.toFixed(2)}</span>
          </div>

          {/* Badges */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {isSpicy && <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black flex items-center gap-1 shadow-lg"><span className="spicy-indicator">🌶️</span> SPICY</span>}
            {isPopular && <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black shadow-lg">⭐ POPULAR</span>}
          </div>

          {!item.available && <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm"><span className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-900/90 to-red-800/90 border-2 border-red-500/50 text-xl font-black text-white shadow-2xl uppercase tracking-wider">Sold Out</span></div>}
        </div>

        {/* Content */}
        <div className="relative p-6">
          <h3 className="text-2xl font-black text-white leading-tight text-glow">{item.name}</h3>
          <p className="mt-3 text-base text-stone-400 line-clamp-2 leading-relaxed">{item.description}</p>

          <button onClick={onCustomize} disabled={!item.available} className="mt-6 w-full py-4 rounded-2xl btn-fire text-white text-lg font-black shadow-2xl shadow-red-900/50 transition-all duration-300 hover:shadow-[0_20px_60px_-10px_rgba(220,38,38,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 relative overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              {item.available ? 'Add to Order' : 'Sold Out'}
            </span>
          </button>
        </div>
      </article>
    );
  }

  // Grid layout (default) - STUNNING Napa Mexican restaurant design
  return (
    <article className={`premium-card group relative overflow-hidden rounded-2xl sm:rounded-3xl transition-all duration-500
      ${isInCart
        ? 'border-2 border-amber-400 ring-2 ring-amber-400/60 shadow-2xl shadow-amber-500/40 animate-warm-glow'
        : ''
      }`}>

      {/* Ambient Mexican restaurant glow */}
      <div className="absolute inset-0 ambiance-overlay pointer-events-none opacity-50" />

      {/* Image container with dramatic effects */}
      <div className={`relative aspect-[4/3] w-full overflow-hidden ${isSpicy ? 'animate-sizzle' : ''}`}>
        {isExternalImage ? (
          <img src={imageSrc} alt={item.name} className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" onError={(e) => { (e.target as HTMLImageElement).src = getStockImageForCategory(item.category || sectionType, 0); }} />
        ) : (
          <Image src={imageSrc} alt={item.name} fill className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110" sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 50vw" unoptimized={isExternalImage || isTenantImage} />
        )}

        {/* Multi-layer cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-transparent to-amber-900/5" />

        {/* Animated shimmer on hover */}
        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Quick Add Button - Bold red with fire effect */}
        {item.available && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="absolute top-3 left-3 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full
              bg-gradient-to-br from-red-600 via-red-700 to-red-800
              border-2 border-amber-400/40
              shadow-xl shadow-red-900/50
              flex items-center justify-center text-white text-xl sm:text-2xl font-black
              transition-all duration-300
              hover:scale-110 hover:from-red-500 hover:border-amber-400/80 hover:shadow-2xl hover:shadow-red-700/60
              active:scale-95
              btn-fire"
            title="Quick add to cart"
          >
            +
          </button>
        )}

        {/* Price badge - Premium gold gradient */}
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 shadow-xl shadow-amber-900/50 border border-amber-200/30 transition-transform duration-300 group-hover:scale-105">
            <span className="text-sm sm:text-lg font-black text-stone-900">${item.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Spicy/Popular indicators */}
        {(isSpicy || isPopular) && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {isSpicy && <span className="px-2 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black flex items-center gap-0.5 shadow-lg"><span className="spicy-indicator text-xs">🌶️</span></span>}
            {isPopular && <span className="px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black shadow-lg">⭐</span>}
          </div>
        )}

        {/* Sold out overlay */}
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm">
            <span className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-900/90 to-red-800/90 border-2 border-red-500/50 text-sm sm:text-base font-black text-white shadow-2xl uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content section with refined typography */}
      <div className="relative p-3 sm:p-5">
        {/* Title with text glow */}
        <h3 className="text-base sm:text-xl font-black text-white leading-tight line-clamp-2 text-glow gold-accent">
          {item.name}
        </h3>

        {/* Description - desktop only */}
        <p className="hidden sm:block mt-4 text-sm text-stone-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Tags with Mexican theme */}
        {item.tags && item.tags.length > 0 && (
          <div className="hidden sm:flex mt-4 flex-wrap gap-1.5">
            {item.tags.filter(t => !t.toLowerCase().includes('spicy') && !t.toLowerCase().includes('popular') && !t.toLowerCase().includes('hot') && !t.toLowerCase().includes('favorite')).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-600/30 px-2.5 py-0.5 text-[10px] font-bold text-red-300 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA Button - Bold fire button */}
        <button
          onClick={onCustomize}
          disabled={!item.available}
          className="mt-3 sm:mt-5 w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl
            btn-fire
            text-white text-sm sm:text-base font-black
            shadow-xl shadow-red-900/50
            transition-all duration-300
            hover:shadow-[0_20px_50px_-10px_rgba(220,38,38,0.5)]
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
        </button>
      </div>
    </article>
  );
}
