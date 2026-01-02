"use client";

import { useTenantTheme } from '../TenantThemeProvider';

interface AccessibilityModalProps {
  open: boolean;
  onClose: () => void;
  state: {
    largeText: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
  };
  onToggleLargeText: () => void;
  onToggleHighContrast: () => void;
  onToggleReducedMotion: () => void;
}

const CONTROLS = [
  {
    id: 'largeText',
    label: 'Large type',
    description: 'Increase body copy, button, and helper text sizes.',
  },
  {
    id: 'highContrast',
    label: 'High contrast',
    description: 'Boost contrast for easier readability.',
  },
  {
    id: 'reducedMotion',
    label: 'Reduced motion',
    description: 'Disable background parallax and hero transitions.',
  },
];

export function AccessibilityModal({
  open,
  onClose,
  state,
  onToggleHighContrast,
  onToggleLargeText,
  onToggleReducedMotion,
}: AccessibilityModalProps) {
  const tenant = useTenantTheme();

  if (!open) return null;

  const toggleMap: Record<string, () => void> = {
    largeText: onToggleLargeText,
    highContrast: onToggleHighContrast,
    reducedMotion: onToggleReducedMotion,
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-gradient-to-b from-[#040713] via-[#0f1729] to-[#060812] text-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Accessibility</p>
            <h2 className="text-2xl font-bold">Customize your menu view</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/60 hover:text-white">
            Close
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {CONTROLS.map((control) => (
            <label
              key={control.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{control.label}</p>
                <p className="text-xs text-white/60">{control.description}</p>
              </div>
              <input
                type="checkbox"
                checked={state[control.id as keyof typeof state]}
                onChange={toggleMap[control.id]}
                className="h-5 w-5 accent-red-500"
              />
            </label>
          ))}
        </div>

        <div className="border-t border-white/10 px-6 py-4 text-xs text-white/50">
          Preferences save locally. Sign in to sync across devices.{tenant.contactEmail && ` Need help? Email ${tenant.contactEmail}`}
        </div>
      </div>
    </div>
  );
}

export default AccessibilityModal;
