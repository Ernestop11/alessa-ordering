"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface FeaturedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  displayImage?: string;
  sectionName?: string;
}

interface FeaturedCarouselProps {
  items: FeaturedItem[];
  onAddToCart?: (item: FeaturedItem) => void;
  onViewDetails?: (item: FeaturedItem) => void;
  title?: string;
  subtitle?: string;
}

export default function FeaturedCarousel({
  items,
  onAddToCart,
  onViewDetails,
  title = 'Chef Recommends',
  subtitle = 'Handpicked favorites from our kitchen',
}: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Limit to top 8 items
  const featuredItems = items.slice(0, 8);

  // Auto-advance on desktop only (wider screens)
  useEffect(() => {
    if (featuredItems.length <= 1) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return; // Skip on mobile

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredItems.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  if (featuredItems.length === 0) {
    return null;
  }

  const currentItem = featuredItems[currentIndex];

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-lg shadow-black/20">
      <header className="mb-3 sm:mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-2xl font-semibold text-white">{title}</h3>
          <p className="text-xs sm:text-sm text-white/60">
            {subtitle}
          </p>
        </div>
        {featuredItems.length > 1 && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrev}
              className="rounded-full border border-white/20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white text-sm transition hover:border-white/40 hover:bg-white/5 active:scale-95"
              aria-label="Previous item"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="rounded-full border border-white/20 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white text-sm transition hover:border-white/40 hover:bg-white/5 active:scale-95"
              aria-label="Next item"
            >
              →
            </button>
          </div>
        )}
      </header>

      {/* Mobile: Horizontal Scroll Cards */}
      <div className="sm:hidden">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          style={{ scrollBehavior: 'smooth' }}
        >
          {featuredItems.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[280px] snap-center"
            >
              <button
                onClick={() => onViewDetails?.(item)}
                className="w-full text-left group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 transition-all active:scale-[0.98]"
              >
                {/* Chef's Pick Badge */}
                {index === 0 && (
                  <div className="absolute right-2 top-2 z-10 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black shadow-lg">
                    ⭐ Chef&apos;s Pick
                  </div>
                )}

                {/* Image */}
                <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                  {(item.displayImage || item.image) ? (
                    <Image
                      src={item.displayImage || item.image || '/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="280px"
                      unoptimized={(item.displayImage || item.image)?.startsWith('/tenant/')}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">🍽️</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  {/* Price badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-amber-500 text-black text-sm font-bold">
                    ${item.price.toFixed(2)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-white/60 line-clamp-2 mt-0.5">
                    {item.description}
                  </p>

                  {onAddToCart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      className="mt-2 w-full rounded-lg bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-3 py-2 text-xs font-bold text-black transition-all active:scale-95"
                    >
                      + Add to Order
                    </button>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Mobile Dots */}
        {featuredItems.length > 1 && (
          <div className="mt-2 flex justify-center gap-1">
            {featuredItems.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-4 bg-amber-400'
                    : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Single Featured Card */}
      <div className="hidden sm:block relative overflow-hidden">
        <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-xl transition-all duration-300 hover:border-white/20">
          {/* Chef's Pick Badge */}
          <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-3 py-1.5 text-sm font-bold text-black shadow-lg">
            ⭐ Chef&apos;s Pick
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Image Section */}
            <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              {(currentItem.displayImage || currentItem.image) ? (
                <Image
                  src={currentItem.displayImage || currentItem.image || '/placeholder.jpg'}
                  alt={currentItem.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  unoptimized={(currentItem.displayImage || currentItem.image)?.startsWith('/tenant/')}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-6xl">🍽️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            {/* Content Section */}
            <div className="flex flex-col justify-center space-y-3 p-5 md:p-6">
              {currentItem.sectionName && (
                <span className="inline-block w-fit rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                  {currentItem.sectionName}
                </span>
              )}

              <h4 className="text-2xl md:text-3xl font-bold text-white">
                {currentItem.name}
              </h4>

              <p className="text-sm md:text-base text-white/80 line-clamp-2">
                {currentItem.description}
              </p>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-amber-200">
                  ${currentItem.price.toFixed(2)}
                </span>
                <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-semibold text-green-300">
                  {currentItem.category}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(currentItem)}
                    className="flex-1 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-5 py-2.5 font-semibold text-black shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Add to Order
                  </button>
                )}
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(currentItem)}
                    className="rounded-full border border-white/40 px-5 py-2.5 font-semibold text-white transition hover:border-white hover:bg-white/10"
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Desktop Dot Indicators */}
      {featuredItems.length > 1 && (
        <div className="hidden sm:flex mt-4 justify-center gap-2">
          {featuredItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-6 bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
