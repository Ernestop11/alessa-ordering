"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export default function FeaturedCarousel({
  items,
  onAddToCart,
  onViewDetails
}: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-sort by createdAt DESC (most recent first) - already done in parent
  // Limit to top 10 items
  const featuredItems = items.slice(0, 10);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (featuredItems.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredItems.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (featuredItems.length === 0) {
    return null;
  }

  const currentItem = featuredItems[currentIndex];

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-white">Chef Recommends</h3>
          <p className="text-sm text-white/60">
            Handpicked favorites from our kitchen
          </p>
        </div>
        {featuredItems.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="rounded-full border border-white/20 px-3 py-2 text-white transition hover:border-white/40 hover:bg-white/5"
              aria-label="Previous item"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="rounded-full border border-white/20 px-3 py-2 text-white transition hover:border-white/40 hover:bg-white/5"
              aria-label="Next item"
            >
              →
            </button>
          </div>
        )}
      </header>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag={featuredItems.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              } else if (swipe > swipeConfidenceThreshold) {
                handlePrev();
              }
            }}
            className="relative"
          >
            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl shadow-black/40 transition-all duration-300 hover:border-white/20 hover:shadow-amber-500/20">
              {/* Chef's Pick Badge */}
              <div className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-lg shadow-amber-500/50">
                ⭐ Chef&apos;s Pick
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden md:h-96 bg-gradient-to-br from-gray-800 to-gray-900">
                  {(currentItem.displayImage || currentItem.image) && (currentItem.displayImage || currentItem.image)?.startsWith('http') ? (
                    <img
                      src={currentItem.displayImage || currentItem.image || '/placeholder.jpg'}
                      alt={currentItem.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1400&q=80';
                      }}
                    />
                  ) : (
                    <Image
                      src={currentItem.displayImage || currentItem.image || '/placeholder.jpg'}
                      alt={currentItem.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(min-width: 768px) 50vw, 100vw"
                      priority
                      unoptimized={(currentItem.displayImage || currentItem.image)?.startsWith('http') || (currentItem.displayImage || currentItem.image)?.startsWith('/tenant/')}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Content Section */}
                <div className="flex flex-col justify-center space-y-4 p-6 md:p-8">
                  {currentItem.sectionName && (
                    <span className="inline-block w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      {currentItem.sectionName}
                    </span>
                  )}

                  <h4 className="text-3xl font-bold text-white md:text-4xl">
                    {currentItem.name}
                  </h4>

                  <p className="text-base text-white/80 md:text-lg">
                    {currentItem.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-amber-200">
                      ${currentItem.price.toFixed(2)}
                    </span>
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                      {currentItem.category}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(currentItem)}
                        className="flex-1 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-6 py-3 font-semibold text-black shadow-lg shadow-amber-500/30 transition-all hover:scale-105 hover:shadow-amber-500/50"
                      >
                        Add to Order
                      </button>
                    )}
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(currentItem)}
                        className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white hover:bg-white/10"
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot Indicators */}
      {featuredItems.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {featuredItems.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Item Counter */}
      <div className="mt-4 text-center text-sm text-white/50">
        {currentIndex + 1} / {featuredItems.length}
      </div>
    </section>
  );
}
