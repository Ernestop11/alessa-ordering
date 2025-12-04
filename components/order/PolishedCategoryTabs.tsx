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
  SPECIAL: '⭐',
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

  useEffect(() => {
    const activeButton = document.querySelector(`[data-tab-id="${activeId}"]`) as HTMLElement;
    if (activeButton && scrollRef.current) {
      const container = scrollRef.current;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const containerWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;

      if (buttonLeft < scrollLeft + 40) {
        container.scrollTo({ left: buttonLeft - 40, behavior: 'smooth' });
      } else if (buttonLeft + buttonWidth > scrollLeft + containerWidth - 40) {
        container.scrollTo({ left: buttonLeft + buttonWidth - containerWidth + 40, behavior: 'smooth' });
      }
    }
  }, [activeId]);

  const handleSelect = (sectionId: string) => {
    onSelect(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const headerHeight = 160;
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
      {/* Left Fade - Subtle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-neutral-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          showLeftGradient ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Right Fade - Subtle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-neutral-900 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
          showRightGradient ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Apple-style Liquid Glass Container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {sections.map((section) => {
          const isActive = activeId === section.id;
          const icon = section.icon || sectionIcons[section.type || 'OTHER'] || '🍽️';

          return (
            <button
              key={section.id}
              data-tab-id={section.id}
              onClick={() => handleSelect(section.id)}
              className={`
                relative flex-shrink-0 flex items-center gap-2
                rounded-full px-4 py-2
                text-[13px] font-medium tracking-wide
                transition-all duration-300 ease-out
                ${isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/90'
                }
              `}
            >
              {/* Liquid Glass Background - Active State */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg,
                      rgba(255,255,255,0.15) 0%,
                      rgba(255,255,255,0.05) 50%,
                      rgba(255,255,255,0.1) 100%
                    )`,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: `
                      0 4px 16px rgba(0,0,0,0.2),
                      inset 0 1px 0 rgba(255,255,255,0.2),
                      inset 0 -1px 0 rgba(0,0,0,0.1)
                    `,
                  }}
                />
              )}

              {/* Hover Background - Inactive State */}
              {!isActive && (
                <span
                  className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center gap-2">
                <span className={`text-sm transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}>
                  {icon}
                </span>
                <span>{section.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
