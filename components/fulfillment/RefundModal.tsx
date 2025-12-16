"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FulfillmentOrder } from './types';

type RefundReason =
  | 'customer_request'
  | 'wrong_order'
  | 'missing_items'
  | 'quality_issue'
  | 'late_delivery'
  | 'order_cancelled'
  | 'duplicate_charge'
  | 'other';

const REFUND_REASONS: { value: RefundReason; label: string; description: string }[] = [
  { value: 'customer_request', label: 'Customer Request', description: 'Customer changed their mind or requested cancellation' },
  { value: 'wrong_order', label: 'Wrong Order', description: 'Incorrect items were prepared or delivered' },
  { value: 'missing_items', label: 'Missing Items', description: 'Some items were missing from the order' },
  { value: 'quality_issue', label: 'Quality Issue', description: 'Food quality did not meet standards' },
  { value: 'late_delivery', label: 'Late Delivery/Pickup', description: 'Order was significantly delayed' },
  { value: 'order_cancelled', label: 'Order Cancelled', description: 'Restaurant cancelled (out of stock, closing, etc.)' },
  { value: 'duplicate_charge', label: 'Duplicate Charge', description: 'Customer was charged twice by mistake' },
  { value: 'other', label: 'Other', description: 'Other reason - please specify in notes' },
];

type RefundType = 'full' | 'partial' | 'items';

interface Props {
  order: FulfillmentOrder;
  onClose: () => void;
  onRefundComplete: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

export default function RefundModal({ order, onClose, onRefundComplete }: Props) {
  const [mounted, setMounted] = useState(false);
  const [refundType, setRefundType] = useState<RefundType>('full');
  const [reason, setReason] = useState<RefundReason>('customer_request');
  const [notes, setNotes] = useState('');
  const [customAmount, setCustomAmount] = useState<string>(order.totalAmount.toFixed(2));
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ refundId: string; amount: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    // Initialize selected items
    const initialItems: Record<string, { selected: boolean; quantity: number }> = {};
    order.items.forEach(item => {
      initialItems[item.id] = { selected: false, quantity: item.quantity };
    });
    setSelectedItems(initialItems);
    return () => {
      document.body.style.overflow = '';
    };
  }, [order.items]);

  const calculateRefundAmount = (): number => {
    if (refundType === 'full') {
      return order.totalAmount;
    }
    if (refundType === 'partial') {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : Math.min(parsed, order.totalAmount);
    }
    if (refundType === 'items') {
      let total = 0;
      order.items.forEach(item => {
        const selection = selectedItems[item.id];
        if (selection?.selected) {
          total += item.price * selection.quantity;
        }
      });
      // Add proportional tax if applicable
      if (order.taxAmount && order.subtotalAmount) {
        const taxRate = order.taxAmount / order.subtotalAmount;
        total += total * taxRate;
      }
      return Math.min(total, order.totalAmount);
    }
    return 0;
  };

  const refundAmount = calculateRefundAmount();

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected: !prev[itemId].selected },
    }));
  };

  const handleItemQuantityChange = (itemId: string, qty: number) => {
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;
    const validQty = Math.max(1, Math.min(qty, item.quantity));
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: validQty },
    }));
  };

  const handleSubmit = async () => {
    if (refundAmount <= 0) {
      setError('Refund amount must be greater than $0');
      return;
    }

    if (reason === 'other' && !notes.trim()) {
      setError('Please provide notes when selecting "Other" as reason');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Build refund items if item-based refund
      const refundItems = refundType === 'items'
        ? order.items
            .filter(item => selectedItems[item.id]?.selected)
            .map(item => ({
              itemId: item.id,
              quantity: selectedItems[item.id].quantity,
              amount: item.price * selectedItems[item.id].quantity,
            }))
        : undefined;

      const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: refundAmount,
          reason,
          notes: notes.trim() || undefined,
          refundItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      setSuccess({
        refundId: data.refundId,
        amount: data.refundAmount,
      });

      // Auto-close after success
      setTimeout(() => {
        onRefundComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f5f3ff',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#5b21b6' }}>
              Process Refund
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#7c3aed' }}>
              Order #{order.id.slice(-6).toUpperCase()} · {formatCurrency(order.totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#ddd6fe',
              color: '#5b21b6',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <span style={{ fontSize: '40px' }}>✓</span>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>
              Refund Processed!
            </h3>
            <p style={{ margin: 0, color: '#666' }}>
              {formatCurrency(success.amount)} has been refunded
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#999' }}>
              ID: {success.refundId}
            </p>
          </div>
        )}

        {/* Main Form */}
        {!success && (
          <div style={{ padding: '24px' }}>
            {/* Error Message */}
            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '20px',
                color: '#dc2626',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            {/* Refund Type Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                Refund Type
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'full', label: 'Full Refund', icon: '💯' },
                  { value: 'partial', label: 'Custom Amount', icon: '💵' },
                  { value: 'items', label: 'Specific Items', icon: '📋' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRefundType(opt.value as RefundType)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: refundType === opt.value ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                      backgroundColor: refundType === opt.value ? '#f5f3ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '1.25rem', marginBottom: '4px' }}>{opt.icon}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: refundType === opt.value ? '#5b21b6' : '#374151' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            {refundType === 'partial' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Refund Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.25rem',
                    color: '#6b7280',
                  }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={order.totalAmount}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 40px',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                    }}
                  />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  Max: {formatCurrency(order.totalAmount)}
                </p>
              </div>
            )}

            {/* Item Selection */}
            {refundType === 'items' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Select Items to Refund
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {order.items.map(item => {
                    const selection = selectedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: selection?.selected ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                          backgroundColor: selection?.selected ? '#f5f3ff' : 'white',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleItemToggle(item.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={selection?.selected || false}
                              onChange={() => {}}
                              style={{ width: '20px', height: '20px', accentColor: '#7c3aed' }}
                            />
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, color: '#111' }}>
                                {item.menuItemName || 'Menu Item'}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#666' }}>
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          {selection?.selected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                              <span style={{ fontSize: '0.75rem', color: '#666' }}>Qty:</span>
                              <select
                                value={selection.quantity}
                                onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value))}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #d1d5db',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {Array.from({ length: item.quantity }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>{n}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                Reason for Refund
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as RefundReason)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                }}
              >
                {REFUND_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                {REFUND_REASONS.find(r => r.value === reason)?.description}
              </p>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                Notes {reason === 'other' && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details about the refund..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.875rem',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Summary */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Order Total</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 700, color: '#5b21b6' }}>Refund Amount</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#5b21b6' }}>
                  {formatCurrency(refundAmount)}
                </span>
              </div>
              {refundAmount < order.totalAmount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6b7280' }}>Customer keeps</span>
                  <span style={{ color: '#059669' }}>{formatCurrency(order.totalAmount - refundAmount)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || refundAmount <= 0}
                style={{
                  flex: 2,
                  padding: '14px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: refundAmount > 0 ? '#7c3aed' : '#d1d5db',
                  color: 'white',
                  fontWeight: 700,
                  cursor: refundAmount > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isProcessing ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    💳 Process Refund
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
