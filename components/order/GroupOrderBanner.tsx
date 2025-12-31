"use client";

import { useState, useEffect } from "react";
import { Users, Clock, X } from "lucide-react";
import { useCart } from "@/lib/store/cart";

interface GroupOrderBannerProps {
  primaryColor?: string;
}

interface GroupOrderInfo {
  name: string | null;
  organizerName: string;
  expiresAt: string;
  timeRemainingMinutes: number;
}

export default function GroupOrderBanner({ primaryColor = "#f59e0b" }: GroupOrderBannerProps) {
  const { groupSessionCode, participantName, clearGroupOrder } = useCart();
  const [groupInfo, setGroupInfo] = useState<GroupOrderInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fetch group order info
  useEffect(() => {
    if (!groupSessionCode) {
      setLoading(false);
      return;
    }

    const fetchGroupInfo = async () => {
      try {
        const response = await fetch(`/api/group-orders/${groupSessionCode}`);
        if (response.ok) {
          const data = await response.json();
          setGroupInfo({
            name: data.name,
            organizerName: data.organizerName,
            expiresAt: data.expiresAt,
            timeRemainingMinutes: data.timeRemainingMinutes,
          });
          setTimeRemaining(data.timeRemainingMinutes);
        } else {
          // Group order not found or expired, clear context
          clearGroupOrder();
        }
      } catch (error) {
        console.error("Failed to fetch group order info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupInfo();
  }, [groupSessionCode, clearGroupOrder]);

  // Update countdown timer
  useEffect(() => {
    if (!groupInfo?.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(groupInfo.expiresAt);
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        clearGroupOrder();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [groupInfo?.expiresAt, clearGroupOrder]);

  // Don't render if not in group order mode or still loading
  if (!groupSessionCode || loading) {
    return null;
  }

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleExit = () => {
    if (confirm("Leave this group order? Your cart will be cleared.")) {
      clearGroupOrder();
    }
  };

  return (
    <div
      className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between gap-3"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-white font-medium text-sm truncate">
            {groupInfo?.name || "Group Order"}
            {participantName && <span className="font-normal opacity-80"> - {participantName}</span>}
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <Clock className="w-3 h-3" />
            <span className={timeRemaining <= 15 ? "text-white font-bold" : ""}>
              {formatTimeRemaining(timeRemaining)} left
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleExit}
        className="flex-shrink-0 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        title="Exit group order"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
