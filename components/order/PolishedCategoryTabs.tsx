"use client";

import { useRef, useEffect, useState } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';

interface Section {
  id: string;
  name: string;
  type?: string;
  items?: any[];
  icon?: string;
}

interface PolishedCategoryTabsProps {
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
  sectionIcons?: Record<string, string>;
}

const DEFAULT_ICONS: Record<string, string> = {
  RESTAURANT: '🌮',
  BAKERY: '🥐',
  GROCERY: '🛒',
  BEVERAGE: '🥤',
  SPECIAL: '👨‍🍳',
  OTHER: '🍽️',
};

export default function PolishedCategoryTabs({
  sections,
  activeId,
  onSelect,
  sectionIcons = DEFAULT_ICONS,
}: PolishedCategoryTabsProps) {
  const tenant = useTenantTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  // Check scroll position to show/hide gradients
  const updateGradients = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftGradient(el.scrollLeft > 10);
    setShowRightGradient(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    updateGradients();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateGradients);
      window.addEventListener('resize', updateGradients);
    }
    return () => {
      el?.removeEventListener('scroll', updateGradients);
      window.removeEventListener('resize', updateGradients);
    };
  }, [sections]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeButton = document.querySelector(`[data-tab-id="${activeId}"]`) as HTMLElement;
    if (activeButton && scrollRef.current) {
      const container = scrollRef.current;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      // Check if button is outside visible area
      if (buttonLeft < scrollLeft + 40) {
        container.scrollTo({ left: buttonLeft - 40, behavior: 'smooth' });
      } else if (buttonLeft + buttonWidth > scrollLeft + containerWidth - 40) {
        container.scrollTo({ left: buttonLeft + buttonWidth - containerWidth + 40, behavior: 'smooth' });
      }
    }
  }, [activeId]);

  const handleSelect = (sectionId: string) => {
    onSelect(sectionId);

    // Smooth scroll to section
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const headerHeight = 180;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - headerHeight,
        behavior: 'smooth'
      });
    }
  };

  if (!sections.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
        Menu sections will appear here once created.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left Fade Gradient */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
          showLeftGradient ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Right Fade Gradient */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-black/90 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
          showRightGradient ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1 -mx-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sections.map((section) => {
          const isActive = activeId === section.id;
          const icon = section.icon || sectionIcons[section.type || 'OTHER'] || '🍽️';
          const itemCount = section.items?.length || 0;

          return (
            <button
              key={section.id}
              data-tab-id={section.id}
              onClick={() => handleSelect(section.id)}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${tenant.primaryColor || '#dc2626'}, ${tenant.secondaryColor || '#f59e0b'})`,
                      boxShadow: `0 8px 24px -4px ${tenant.primaryColor || '#dc2626'}50`,
                    }
                  : undefined
              }
              className={`relative flex-shrink-0 flex items-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-white scale-[1.02]'
                  : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {/* Icon */}
              <span className={`text-sm md:text-base transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {icon}
              </span>

              {/* Label */}
              <span className="whitespace-nowrap">{section.name}</span>

              {/* Item Count Badge - Hidden on mobile for cleaner look */}
              {itemCount > 0 && (
                <span className={`hidden md:inline-flex ml-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {itemCount}
                </span>
              )}

              {/* Active Indicator Line */}
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 md:w-8 h-0.5 bg-white/60 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
