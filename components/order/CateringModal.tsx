"use client";

import { useId } from 'react';
import { ChefHat, PhoneCall } from 'lucide-react';
import { useTenantTheme } from '../TenantThemeProvider';

interface CateringModalProps {
  open: boolean;
  onClose: () => void;
}

const PACKAGES = [
  {
    name: 'Taquiza Experience',
    price: '$22 / guest',
    details: 'Hand-pressed tortillas, four proteins, six toppings, aguas frescas.',
    badge: 'Most Popular',
  },
  {
    name: 'Birria & Consommé Bar',
    price: '$28 / guest',
    details: 'Slow-braised birria, crispy quesabirrias, consommé shooters, pickled garnish bar.',
    badge: 'Signature',
  },
  {
    name: 'Pan Dulce + Café',
    price: '$18 / guest',
    details: 'Nixtamal waffles, churro bites, seasonal pan dulce, café de olla service.',
    badge: 'Morning Events',
  },
];

export function CateringModal({ open, onClose }: CateringModalProps) {
  const formId = useId();
  const tenant = useTenantTheme();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-3xl rounded-t-3xl border border-[#ff0000]/50 bg-white text-center text-[#2b0909] shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#ff0000]/20 px-6 py-4">
          <div className="mx-auto space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#cc0000]">Las Reinas Catering</p>
            <h2 className="text-2xl font-black text-[#cc0000]">Full-service events, delivered.</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-[#ff0000]/30 px-3 py-1 text-sm text-[#cc0000] transition hover:bg-[#ff0000]/10">
            Close
          </button>
        </div>

        <div className="grid gap-4 border-b border-[#ff0000]/15 p-6 sm:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div key={pkg.name} className="rounded-2xl border border-[#ff0000]/50 bg-[#fff6f6] p-6 text-center">
              <p className="text-[11px] uppercase tracking-[0.4em] text-[#cc0000]">{pkg.badge}</p>
              <h3 className="text-lg font-semibold text-[#1f0606]">{pkg.name}</h3>
              <p className="text-sm text-[#5c1a1a]">{pkg.details}</p>
              <p className="mt-3 text-2xl font-black text-[#ff0000]">{pkg.price}</p>
            </div>
          ))}
        </div>

        <form
          aria-labelledby={`${formId}-label`}
          className="grid gap-3 p-6 text-center sm:grid-cols-2"
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
            {PACKAGES.map((pkg) => (
              <option key={pkg.name}>{pkg.name}</option>
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
