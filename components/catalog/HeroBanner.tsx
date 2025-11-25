"use client";

import { useMemo } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';

interface HeroBannerProps {
  images: string[];
  title: string;
  subtitle: string;
  onAddHighlight?: () => void;
  onImageError?: () => void;
}

export function HeroBanner({ images, title, subtitle, onAddHighlight, onImageError }: HeroBannerProps) {
  const tenant = useTenantTheme();
  const grid = useMemo(() => {
    if (images.length >= 4) return images.slice(0, 4);
    const fallback = [...images];
    while (fallback.length < 4) fallback.push(images[0] ?? '/tenant/lasreinas/images/hero.jpg');
    return fallback;
  }, [images]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 via-black/30 to-black/60 px-6 py-10 text-white shadow-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">Las Reinas Catalog</p>
            <h1 className="text-4xl font-black sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-3 text-white/80">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
              Chef curated
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
              Scratch kitchen
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onAddHighlight}
              style={{
                background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                boxShadow: `0 10px 15px -3px ${tenant.primaryColor}66, 0 4px 6px -2px ${tenant.primaryColor}66`,
              }}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
            >
              Add featured dish
            </button>
            <button className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white">
              Download catering PDF
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          {grid.map((image, index) => (
            <div key={image + index} className={`overflow-hidden rounded-3xl border border-white/10 ${index === 1 ? 'row-span-2' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Las Reinas hero ${index + 1}`}
                onError={onImageError}
                className={`h-full w-full object-cover ${index === 1 ? 'min-h-[200px]' : 'min-h-[120px]'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeroBanner;
