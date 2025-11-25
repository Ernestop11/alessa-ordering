"use client";

interface RewardsModalProps {
  open: boolean;
  onClose: () => void;
}

export function RewardsModal({ open, onClose }: RewardsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-[#ff0000]/40 bg-white text-center shadow-2xl sm:rounded-3xl">
        <div className="space-y-4 px-6 py-8 text-[#300]">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#cc0000]">Rewards</p>
          <h3 className="text-2xl font-black text-[#cc0000]">Coming Soon</h3>
          <p className="text-sm text-gray-600">
            Earn quesabirria perks, pan dulce drops, and VIP tastings. We&apos;re finishing the Las Reinas loyalty program now.
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-[#ff0000] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ff0000]/40 transition hover:bg-[#cc0000]"
          >
            Keep ordering
          </button>
        </div>
      </div>
    </div>
  );
}

export default RewardsModal;
