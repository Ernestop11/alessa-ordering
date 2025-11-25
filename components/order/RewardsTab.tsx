"use client";

import { Gift } from 'lucide-react';

interface RewardsTabProps {
  onClick?: () => void;
  className?: string;
}

export function RewardsTab({ onClick, className = '' }: RewardsTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-[#ff0000]/60 bg-[#ff0000]/15 px-4 py-2 text-sm font-semibold text-[#ff0000] shadow-inner shadow-[#ff0000]/20 transition hover:bg-[#ff0000]/25 ${className}`}
    >
      <Gift className="h-4 w-4" />
      Rewards
    </button>
  );
}

export default RewardsTab;
