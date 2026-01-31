'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  tags: string[];
  isFeatured: boolean;
}

interface MenuSection {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

interface DisplayClientProps {
  sections: MenuSection[];
  tenantName: string;
  tenantSlug: string;
  screen: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}

export default function DisplayClient({
  sections: initialSections,
  tenantName,
  tenantSlug,
  screen,
  primaryColor,
  secondaryColor,
  logoUrl,
}: DisplayClientProps) {
  const [sections, setSections] = useState(initialSections);
  const [currentPage, setCurrentPage] = useState(0);
  const [clock, setClock] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Split sections between screens: left gets first half, right gets second half
  const midpoint = Math.ceil(sections.length / 2);
  const displaySections =
    screen === 'right' ? sections.slice(midpoint) : sections.slice(0, midpoint);

  // If no sections for this screen, show all
  const visibleSections = displaySections.length > 0 ? displaySections : sections;

  // Paginate: show 2 sections per page for readability on TV
  const SECTIONS_PER_PAGE = 2;
  const pages: MenuSection[][] = [];
  for (let i = 0; i < visibleSections.length; i += SECTIONS_PER_PAGE) {
    pages.push(visibleSections.slice(i, i + SECTIONS_PER_PAGE));
  }

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Los_Angeles',
        })
      );
    };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate pages every 15 seconds
  useEffect(() => {
    if (pages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((p) => (p + 1) % pages.length);
    }, 15_000);
    return () => clearInterval(interval);
  }, [pages.length]);

  // SSE: listen for menu updates
  const connectSSE = useCallback(() => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(`/api/signage/events?tenant=${tenantSlug}`);
    sseRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'menu-update' && data.sections) {
          setSections(data.sections);
          setCurrentPage(0);
        } else if (data.type === 'refresh') {
          window.location.reload();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 10 seconds
      setTimeout(connectSSE, 10_000);
    };
  }, [tenantSlug]);

  useEffect(() => {
    connectSSE();
    return () => sseRef.current?.close();
  }, [connectSSE]);

  // Auto-refresh every 30 minutes as fallback
  useEffect(() => {
    const timeout = setTimeout(() => window.location.reload(), 30 * 60 * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const currentPageSections = pages[currentPage] || [];

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#0a0a0a', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header bar */}
      <header
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={tenantName}
            className="h-14 w-14 object-contain rounded-lg bg-white/10 p-1"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 className="text-3xl font-bold tracking-tight">{tenantName}</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-lg opacity-80 uppercase tracking-widest">
            {screen === 'right' ? 'Screen B' : 'Screen A'}
          </span>
          <span className="text-2xl font-mono font-semibold">{clock}</span>
        </div>
      </header>

      {/* Menu content */}
      <main ref={scrollRef} className="flex-1 overflow-hidden px-8 py-6">
        <div className="h-full grid grid-cols-1 gap-6">
          {currentPageSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          ))}
        </div>
      </main>

      {/* Footer with page indicator */}
      <footer className="shrink-0 px-8 py-3 flex items-center justify-between border-t border-white/10">
        <span className="text-sm opacity-50">Powered by Alessa Cloud</span>
        {pages.length > 1 && (
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === currentPage ? secondaryColor : 'rgba(255,255,255,0.2)',
                  transform: i === currentPage ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}

function SectionCard({
  section,
  primaryColor,
  secondaryColor,
}: {
  section: MenuSection;
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="bg-white/5 rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Section header */}
      <div
        className="px-6 py-4 border-b border-white/10"
        style={{ background: `${primaryColor}33` }}
      >
        <h2 className="text-2xl font-bold" style={{ color: secondaryColor }}>
          {section.name}
        </h2>
        {section.description && (
          <p className="text-sm text-white/60 mt-1">{section.description}</p>
        )}
      </div>

      {/* Items grid */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-2 gap-3 h-full auto-rows-min">
          {section.items.map((item) => (
            <ItemRow key={item.id} item={item} secondaryColor={secondaryColor} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  secondaryColor,
}: {
  item: MenuItem;
  secondaryColor: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight truncate">{item.name}</h3>
          <span
            className="text-lg font-bold shrink-0"
            style={{ color: secondaryColor }}
          >
            ${item.price.toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-white/50 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
