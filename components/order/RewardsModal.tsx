"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTenantTheme } from '../TenantThemeProvider';

interface RewardsModalProps {
  open: boolean;
  onClose: () => void;
}

export function RewardsModal({ open, onClose }: RewardsModalProps) {
  const [mounted, setMounted] = useState(false);
  const tenant = useTenantTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      className="sm:items-center bg-black/80 backdrop-blur-md"
    >
      <div
        style={{ zIndex: 9999, borderColor: `${tenant.primaryColor}66` }}
        className="w-full max-w-md rounded-t-3xl border bg-white text-center shadow-2xl sm:rounded-3xl"
      >
        <div className="space-y-4 px-6 py-8 text-[#300]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: tenant.primaryColor }}>Rewards</p>
          <h3 className="text-2xl font-black" style={{ color: tenant.primaryColor }}>Coming Soon</h3>
          <p className="text-sm text-gray-600">
            Earn exclusive perks and VIP benefits. We&apos;re finishing the {tenant.name} loyalty program now.
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg transition"
            style={{ backgroundColor: tenant.primaryColor, boxShadow: `0 4px 14px ${tenant.primaryColor}66` }}
          >
            Keep ordering
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RewardsModal;
