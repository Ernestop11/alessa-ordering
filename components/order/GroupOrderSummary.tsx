"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Users,
  Clock,
  MapPin,
  Printer,
  StopCircle,
  RefreshCw,
  Timer,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GroupOrderSummaryProps {
  sessionCode: string;
  open: boolean;
  onClose: () => void;
  primaryColor?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItemName: string;
  notes: string | null;
}

interface ParticipantOrder {
  id: string;
  participantName: string | null;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  items: OrderItem[];
}

interface GroupOrderData {
  id: string;
  sessionCode: string;
  name: string | null;
  organizerName: string;
  organizerEmail: string | null;
  organizerPhone: string | null;
  fulfillmentMethod: string;
  scheduledPickupTime: string | null;
  status: string;
  expiresAt: string;
  closedAt: string | null;
  orderCount: number;
  totalAmount: number;
  timeRemainingMinutes: number;
  orders: ParticipantOrder[];
  createdAt: string;
}

export default function GroupOrderSummary({
  sessionCode,
  open,
  onClose,
  primaryColor = "#f59e0b",
}: GroupOrderSummaryProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GroupOrderData | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch group order data
  useEffect(() => {
    if (!open || !sessionCode) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/group-orders/${sessionCode}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch group order");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group order");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [open, sessionCode]);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleAction = async (action: "close" | "extend" | "reopen") => {
    if (!data) return;

    setActionLoading(action);

    try {
      const body: Record<string, unknown> = { action };
      if (action === "extend") {
        body.extendHours = 1;
      }

      const response = await fetch(`/api/group-orders/${sessionCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} group order`);
      }

      // Refresh data
      const refreshResponse = await fetch(`/api/group-orders/${sessionCode}`);
      if (refreshResponse.ok) {
        setData(await refreshResponse.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    if (!data) return;

    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Group Order - ${data.name || data.sessionCode}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 5px; }
          h2 { font-size: 18px; margin-top: 30px; border-bottom: 2px solid #000; padding-bottom: 5px; }
          .meta { color: #666; margin-bottom: 20px; }
          .participant { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
          .participant-name { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ddd; }
          .item-name { flex: 1; }
          .item-qty { width: 60px; text-align: center; }
          .item-price { width: 80px; text-align: right; }
          .total { font-weight: bold; margin-top: 10px; text-align: right; }
          .grand-total { font-size: 20px; font-weight: bold; margin-top: 30px; padding-top: 15px; border-top: 2px solid #000; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>GROUP ORDER: ${data.name || "Group Order"}</h1>
        <div class="meta">
          <div>Session: ${data.sessionCode}</div>
          <div>Organizer: ${data.organizerName}</div>
          <div>Method: ${data.fulfillmentMethod}</div>
          <div>Orders: ${data.orderCount}</div>
          <div>Printed: ${new Date().toLocaleString()}</div>
        </div>

        ${data.orders
          .map(
            (order, index) => `
          <div class="participant">
            <div class="participant-name">${index + 1}. ${order.participantName || "Guest"}</div>
            ${order.items
              .map(
                (item) => `
              <div class="item">
                <span class="item-name">${item.menuItemName}${item.notes ? ` (${item.notes})` : ""}</span>
                <span class="item-qty">x${item.quantity}</span>
                <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `
              )
              .join("")}
            <div class="total">Subtotal: $${order.total.toFixed(2)}</div>
          </div>
        `
          )
          .join("")}

        <div class="grand-total">
          Grand Total: $${data.totalAmount.toFixed(2)}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return "Expired";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Open
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
            Closed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            Cancelled
          </span>
        );
      case "fulfilled":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            Fulfilled
          </span>
        );
      default:
        return null;
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9998 }}
      className="flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        style={{ zIndex: 9999 }}
        className="w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 relative p-5 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}30` }}
            >
              <Users className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Group Order Summary</h2>
              <p className="text-sm text-white/50">Manage and view all orders</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-2 border-white/20 border-t-amber-500 rounded-full animate-spin mb-4" />
              <p className="text-white/50">Loading group order...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Group Info Card */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    {data.name || "Group Order"}
                  </h3>
                  {getStatusBadge(data.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize">{data.fulfillmentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Users className="w-4 h-4" />
                    <span>{data.orderCount} orders</span>
                  </div>
                  {data.status === "open" && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-white/70" />
                      <span
                        className={
                          data.timeRemainingMinutes <= 15
                            ? "text-red-400 font-medium"
                            : "text-white/70"
                        }
                      >
                        {formatTimeRemaining(data.timeRemainingMinutes)} left
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">
                      {data.sessionCode}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50">Total</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      ${data.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {data.status === "open" && (
                  <>
                    <button
                      onClick={() => handleAction("close")}
                      disabled={actionLoading !== null}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "close" ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <StopCircle className="w-4 h-4" />
                      )}
                      Close Orders
                    </button>
                    <button
                      onClick={() => handleAction("extend")}
                      disabled={actionLoading !== null}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "extend" ? (
                        <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      +1 Hour
                    </button>
                  </>
                )}
                {data.status === "closed" && (
                  <button
                    onClick={() => handleAction("reopen")}
                    disabled={actionLoading !== null}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === "reopen" ? (
                      <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Reopen (+1hr)
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  disabled={data.orders.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Orders List */}
              <div>
                <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
                  Participant Orders ({data.orders.length})
                </h4>

                {data.orders.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No orders yet</p>
                    <p className="text-sm mt-1">Share the link to start receiving orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.orders.map((order, index) => (
                      <div
                        key={order.id}
                        className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                      >
                        {/* Order Header */}
                        <button
                          onClick={() => toggleOrderExpanded(order.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                            >
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-white">
                                {order.participantName || "Guest"}
                              </p>
                              <p className="text-xs text-white/50">
                                {order.itemCount} items • {formatTime(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold" style={{ color: primaryColor }}>
                              ${order.total.toFixed(2)}
                            </span>
                            {expandedOrders.has(order.id) ? (
                              <ChevronUp className="w-4 h-4 text-white/50" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-white/50" />
                            )}
                          </div>
                        </button>

                        {/* Order Items (Expandable) */}
                        {expandedOrders.has(order.id) && (
                          <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-white">
                                    {item.quantity}x {item.menuItemName}
                                  </span>
                                  {item.notes && (
                                    <p className="text-xs text-white/40 truncate">{item.notes}</p>
                                  )}
                                </div>
                                <span className="text-white/70 ml-3">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
