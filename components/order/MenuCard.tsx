"use client";

import Image from 'next/image';
import { useState } from 'react';
import { getStockImageForCategory } from '../../lib/menu-imagery';

interface CustomizationOption {
  id: string;
  label: string;
  price: number;
}

interface MenuCardProps {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
    image?: string | null;
    displayImage?: string;
    emoji?: string;
    tags?: string[];
    displayGallery?: string[];
  };
  sectionType: string;
  sectionName: string;
  onAddToCart: (item: any, image?: string | null) => void;
  onCustomize: (item: any, sectionType: string) => void;
  variant?: 'default' | 'compact' | 'featured';
  accentColor?: string;
}

export default function MenuCard({
  item,
  sectionType,
  sectionName,
  onAddToCart,
  onCustomize,
  variant = 'default',
  accentColor = '#dc2626',
}: MenuCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayImage = imageError
    ? getStockImageForCategory(item.category || sectionType, 0)
    : (item.displayImage || item.image || getStockImageForCategory(item.category || sectionType, 0));

  const isBakery = sectionType === 'BAKERY' || sectionName.toLowerCase().includes('panad') || sectionName.toLowerCase().includes('bakery');

  if (variant === 'compact') {
    return (
      <article
        className="group relative flex gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900">
          <Image
            src={displayImage}
            alt={item.name}
            fill
            className={`object-cover transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
            sizes="80px"
            onError={() => setImageError(true)}
            unoptimized={displayImage?.startsWith('http')}
          />
          {item.emoji && (
            <span className="absolute bottom-1 left-1 text-sm drop-shadow-lg">{item.emoji}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white text-sm leading-tight line-clamp-1">{item.name}</h3>
              <span className="text-sm font-bold text-white/90 flex-shrink-0">${item.price.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-xs text-white/50 line-clamp-2 leading-relaxed">{item.description}</p>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => onAddToCart(item, item.displayImage)}
            disabled={!item.available}
            className="mt-2 w-full rounded-lg bg-white/10 py-1.5 text-xs font-medium text-white/90 transition-all hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {item.available ? '+ Add' : 'Sold Out'}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] ${
        isBakery
          ? 'bg-gradient-to-br from-amber-950/40 via-neutral-900/60 to-amber-950/40 border-amber-500/20 hover:border-amber-400/40 hover:shadow-amber-500/20'
          : 'bg-gradient-to-br from-neutral-900/80 via-neutral-900/60 to-neutral-800/80 border-white/[0.08] hover:border-white/[0.15] hover:shadow-red-500/10'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900">
        <Image
          src={displayImage}
          alt={item.name}
          fill
          className={`object-cover transition-all duration-700 ${isHovered ? 'scale-110 brightness-110' : 'scale-100'}`}
          sizes="(min-width: 1280px) 380px, (min-width: 768px) 320px, 100vw"
          onError={() => setImageError(true)}
          unoptimized={displayImage?.startsWith('http')}
          priority={variant === 'featured'}
        />

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 ${
          isBakery
            ? 'bg-gradient-to-t from-amber-950/95 via-amber-950/40 to-transparent'
            : 'bg-gradient-to-t from-black/90 via-black/30 to-transparent'
        }`} />

        {/* Top Badge */}
        {item.tags && item.tags[0] && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-lg ${
              isBakery
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black'
                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
            }`}>
              {item.tags[0]}
            </span>
          </div>
        )}

        {/* Bottom Left Info */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {item.emoji && (
            <span className="text-2xl drop-shadow-lg filter">{item.emoji}</span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-md ${
            isBakery
              ? 'bg-amber-500/30 text-amber-100 border border-amber-400/30'
              : 'bg-black/40 text-white/80 border border-white/20'
          }`}>
            {sectionName}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title & Price Row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-bold text-base leading-snug line-clamp-2 ${
            isBakery ? 'text-amber-50' : 'text-white'
          }`}>
            {item.name}
          </h3>
          <span className={`text-lg font-black flex-shrink-0 ${
            isBakery ? 'text-amber-300' : 'text-white'
          }`}>
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed line-clamp-2 ${
          isBakery ? 'text-amber-100/60' : 'text-white/50'
        }`}>
          {item.description}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onCustomize(item, sectionType)}
            disabled={!item.available}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              isBakery
                ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black hover:from-amber-300 hover:to-orange-300 hover:shadow-lg hover:shadow-amber-500/25'
                : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:shadow-red-500/25'
            }`}
          >
            {item.available ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            ) : 'Sold Out'}
          </button>

          <button
            onClick={() => onAddToCart(item, item.displayImage)}
            disabled={!item.available}
            className={`rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              isBakery
                ? 'bg-amber-500/10 text-amber-200 border border-amber-400/20 hover:bg-amber-500/20 hover:border-amber-400/40'
                : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Quick
          </button>
        </div>
      </div>
    </article>
  );
}
