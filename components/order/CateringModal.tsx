"use client";

import { useId, useEffect, useState } from 'react';
import { ChefHat, PhoneCall } from 'lucide-react';
import { useTenantTheme } from '../TenantThemeProvider';

interface CateringModalProps {
  open: boolean;
  onClose: () => void;
}

interface CateringPackage {
  id: string;
  name: string;
  description: string;
  pricePerGuest: number;
  image: string | null;
  badge: string | null;
  available: boolean;
}

interface CateringSection {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  packages: CateringPackage[];
}

export function CateringModal({ open, onClose }: CateringModalProps) {
  const formId = useId();
  const tenant = useTenantTheme();
  const [sections, setSections] = useState<CateringSection[]>([]);
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (open) {
      fetch('/api/catering-packages')
        .then((res) => res.json())
        .then((data) => {
          setSections(data.sections || []);
          setGallery(data.gallery || []);
          // Flatten all packages for the form dropdown
          const allPackages = (data.sections || []).flatMap((s: CateringSection) => s.packages);
          setPackages(allPackages);
        })
        .catch((err) => console.error('Failed to fetch catering packages', err));
    }
  }, [open]);

  // Auto-rotate gallery every 5 seconds
  useEffect(() => {
    if (gallery.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % gallery.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [gallery.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-6xl rounded-t-3xl border border-[#ff0000]/50 bg-white text-center text-[#2b0909] shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        {/* Gallery Carousel */}
        {gallery.length > 0 && (
          <div className="relative w-full h-64 overflow-hidden sm:rounded-t-3xl">
            {gallery.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`Catering ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  i === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Slide indicators */}
            {gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[#ff0000]/20 px-6 py-4">
          <div className="mx-auto space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#cc0000]">Las Reinas Catering</p>
            <h2 className="text-2xl font-black text-[#cc0000]">Full-service events, delivered.</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-[#ff0000]/30 px-3 py-1 text-sm text-[#cc0000] transition hover:bg-[#ff0000]/10">
            Close
          </button>
        </div>

        {/* Display sections with hero images */}
        <div className="space-y-8 p-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4">
              {/* Section Header with Hero Image */}
              {section.imageUrl && (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-[#ff0000]/30">
                  <img
                    src={section.imageUrl}
                    alt={section.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-left w-full">
                      <h3 className="text-2xl font-black text-white mb-1">{section.name}</h3>
                      {section.description && (
                        <p className="text-sm text-white/90">{section.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {!section.imageUrl && (
                <div className="text-left">
                  <h3 className="text-2xl font-black text-[#cc0000] mb-1">{section.name}</h3>
                  {section.description && (
                    <p className="text-sm text-[#5c1a1a]">{section.description}</p>
                  )}
                </div>
              )}

              {/* Packages Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl border border-[#ff0000]/50 bg-[#fff6f6] overflow-hidden">
                    {pkg.image && (
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-6 text-center">
                      {pkg.badge && <p className="text-[11px] uppercase tracking-[0.4em] text-[#cc0000]">{pkg.badge}</p>}
                      <h4 className="text-lg font-semibold text-[#1f0606]">{pkg.name}</h4>
                      <p className="text-sm text-[#5c1a1a]">{pkg.description}</p>
                      <p className="mt-3 text-2xl font-black text-[#ff0000]">${pkg.pricePerGuest.toFixed(2)} / guest</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form
          aria-labelledby={`${formId}-label`}
          className="grid gap-3 p-6 text-center sm:grid-cols-2 border-t border-[#ff0000]/15"
        >
          <div className="sm:col-span-2">
            <p id={`${formId}-label`} className="text-xs uppercase tracking-[0.4em] text-[#cc0000]">
              Event details
            </p>
          </div>
          <input
            required
            placeholder="Full name"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
          />
          <input
            required
            type="tel"
            placeholder="Phone"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
          />
          <input
            placeholder="Event date"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
          />
          <input
            type="number"
            min={10}
            placeholder="Guest count"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40"
          />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40">
            <option>Package interest</option>
            {packages.map((pkg) => (
              <option key={pkg.id}>{pkg.name}</option>
            ))}
          </select>
          <textarea
            rows={4}
            placeholder="Tell us about the vibe, venue, and any special requests."
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/40 sm:col-span-2"
          />
          <button
            type="button"
            style={{
              background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
              boxShadow: `0 10px 15px -3px ${tenant.primaryColor}66, 0 4px 6px -2px ${tenant.primaryColor}66`,
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] sm:col-span-2"
          >
            <ChefHat className="h-4 w-4" />
            Request tasting
          </button>
          <a
            href="tel:15304587775"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ff0000]/30 px-4 py-3 text-sm font-semibold text-[#cc0000] transition hover:border-[#ff0000] sm:col-span-2"
          >
            <PhoneCall className="h-4 w-4 text-emerald-300" />
            (530) 458-7775 concierge
          </a>
        </form>
      </div>
    </div>
  );
}

export default CateringModal;
