"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, MapPin, Calendar, AlertCircle, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/store/cart";

interface GroupOrderJoinClientProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    logo: string | null;
  };
  groupOrder: {
    id: string;
    sessionCode: string;
    name: string | null;
    organizerName: string;
    fulfillmentMethod: string;
    scheduledPickupTime: string | null;
    status: string;
    expiresAt: string;
    orderCount: number;
    isExpired: boolean;
    isClosed: boolean;
    timeRemainingMinutes: number;
  };
}

export default function GroupOrderJoinClient({
  tenant,
  groupOrder,
}: GroupOrderJoinClientProps) {
  const router = useRouter();
  const [participantName, setParticipantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(groupOrder.timeRemainingMinutes);
  const { setGroupOrder } = useCart();

  // Update countdown timer
  useEffect(() => {
    if (groupOrder.isExpired || groupOrder.isClosed) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(groupOrder.expiresAt);
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [groupOrder.expiresAt, groupOrder.isExpired, groupOrder.isClosed]);

  const handleJoin = () => {
    if (!participantName.trim()) {
      setError("Please enter your name");
      return;
    }

    // Store group order context in cart
    setGroupOrder(groupOrder.sessionCode, participantName.trim());

    // Redirect to order page
    router.push("/order");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Show expired/closed state
  if (groupOrder.isExpired || groupOrder.isClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Group Order {groupOrder.isExpired ? "Expired" : "Closed"}
          </h1>
          <p className="text-white/60 mb-6">
            This group order is no longer accepting new orders.
            {groupOrder.orderCount > 0 && ` ${groupOrder.orderCount} orders were placed.`}
          </p>
          <button
            onClick={() => router.push("/order")}
            className="px-6 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
          >
            Order Individually
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.primaryColor || "#f59e0b";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="h-10" />
          ) : (
            <span className="text-xl font-bold text-white">{tenant.name}</span>
          )}
          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
          >
            Group Order
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4 pt-8">
        {/* Group Info Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Users className="w-8 h-8" style={{ color: primaryColor }} />
          </div>

          {/* Group Name */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {groupOrder.name || "Group Order"}
          </h1>

          {/* Organizer */}
          <p className="text-white/60 mb-4">
            Organized by <span className="text-white font-medium">{groupOrder.organizerName}</span>
          </p>

          {/* Details */}
          <div className="space-y-3">
            {/* Fulfillment Method */}
            <div className="flex items-center gap-3 text-white/80">
              <MapPin className="w-5 h-5 text-white/50" />
              <span className="capitalize">{groupOrder.fulfillmentMethod}</span>
            </div>

            {/* Scheduled Time */}
            {groupOrder.scheduledPickupTime && (
              <div className="flex items-center gap-3 text-white/80">
                <Calendar className="w-5 h-5 text-white/50" />
                <span>Pickup at {formatTime(groupOrder.scheduledPickupTime)}</span>
              </div>
            )}

            {/* Time Remaining */}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-white/50" />
              <span
                className={`font-medium ${
                  timeRemaining <= 15 ? "text-red-400" : "text-white/80"
                }`}
              >
                {formatTimeRemaining(timeRemaining)} remaining to order
              </span>
            </div>

            {/* Order Count */}
            {groupOrder.orderCount > 0 && (
              <div className="pt-2 border-t border-white/10 mt-3">
                <span className="text-white/60">
                  {groupOrder.orderCount} {groupOrder.orderCount === 1 ? "person has" : "people have"} ordered
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Join Form */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Join this group order</h2>

          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => {
                setParticipantName(e.target.value);
                setError(null);
              }}
              placeholder="Enter your name (for order labeling)"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoin();
                }
              }}
            />
            <p className="text-xs text-white/40 mt-2">
              Your name will be printed on your order for easy pickup
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={handleJoin}
            className="w-full py-4 rounded-xl font-bold text-black/90 flex items-center justify-center gap-2 shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${tenant.secondaryColor || primaryColor})`,
            }}
          >
            Start Ordering
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-white/40 mt-6 px-4">
          You&apos;ll pay for your own order. All orders will be grouped together for {groupOrder.fulfillmentMethod}.
        </p>
      </div>
    </div>
  );
}
