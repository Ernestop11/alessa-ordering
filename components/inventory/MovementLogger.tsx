'use client';

import { useState, useEffect, useCallback } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  costPerUnit: number | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  item: { id: string; name: string; unit: string; category: string };
}

interface MovementLoggerProps {
  tenantSlug: string;
  departmentId: string;
  items: InventoryItem[];
  onRefresh: () => void;
}

const MOVEMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase', color: 'bg-green-900/50 text-green-400', desc: 'Received from vendor' },
  { value: 'SPOILAGE', label: 'Spoilage', color: 'bg-red-900/50 text-red-400', desc: 'Lost / damaged / expired' },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: 'bg-blue-900/50 text-blue-400', desc: 'Count correction (+/-)' },
  { value: 'RETURN', label: 'Return', color: 'bg-orange-900/50 text-orange-400', desc: 'Returned to vendor' },
];

export default function MovementLogger({ tenantSlug, departmentId, items, onRefresh }: MovementLoggerProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedItem, setSelectedItem] = useState('');
  const [movementType, setMovementType] = useState('PURCHASE');
  const [quantity, setQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [loggedBy, setLoggedBy] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const authParam = `tenantSlug=${tenantSlug}`;

  const fetchMovements = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory/movements?departmentId=${departmentId}&limit=30&${authParam}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error('Failed to fetch movements:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, authParam]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleSubmit = async () => {
    if (!selectedItem || !quantity || !loggedBy) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/movements?${authParam}&employee=${encodeURIComponent(loggedBy)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem,
          type: movementType,
          quantity: parseFloat(quantity),
          costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
          notes: notes || `Logged by ${loggedBy}`,
        }),
      });

      if (res.ok) {
        setShowSuccess(true);
        setSelectedItem('');
        setQuantity('');
        setCostPerUnit('');
        setNotes('');
        fetchMovements();
        onRefresh();
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to log movement');
      }
    } catch (err) {
      alert('Failed to log movement');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeInfo = (type: string) => {
    return MOVEMENT_TYPES.find((t) => t.value === type) || { label: type, color: 'bg-gray-800 text-gray-400' };
  };

  const selectedItemData = items.find((i) => i.id === selectedItem);

  return (
    <div>
      {/* Success Banner */}
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-center text-sm">
          Movement logged successfully!
        </div>
      )}

      {/* Log Movement Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Log Stock Movement</h3>

        {/* Your Name */}
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Your Name</label>
          <input
            type="text"
            value={loggedBy}
            onChange={(e) => setLoggedBy(e.target.value)}
            placeholder="e.g., Carlos"
            className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base"
          />
        </div>

        {/* Movement Type */}
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {MOVEMENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setMovementType(type.value)}
                className={`p-3 rounded-lg border text-sm text-left transition-all ${
                  movementType === type.value
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <span className="font-medium">{type.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Item Select */}
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Item</label>
          <select
            value={selectedItem}
            onChange={(e) => {
              setSelectedItem(e.target.value);
              const item = items.find((i) => i.id === e.target.value);
              if (item && !costPerUnit) {
                // Don't auto-fill cost, leave for user
              }
            }}
            className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base"
          >
            <option value="">Select item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} (Stock: {item.currentStock} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity + Cost */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Quantity {selectedItemData ? `(${selectedItemData.unit})` : ''}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="0"
              className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base text-center"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cost/Unit ($)</label>
            <input
              type="number"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Optional"
              className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-base text-center"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedItem || !quantity || !loggedBy || submitting}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-base disabled:opacity-50 transition-colors touch-manipulation"
        >
          {submitting ? 'Logging...' : `Log ${getTypeInfo(movementType).label}`}
        </button>
      </div>

      {/* Recent Movements */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent Activity
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : movements.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No movements logged yet</p>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => {
              const typeInfo = getTypeInfo(m.type);
              return (
                <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-sm font-medium">{m.item.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${m.quantity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {m.quantity >= 0 ? '+' : ''}{m.quantity} {m.item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{m.createdBy} &middot; {new Date(m.createdAt).toLocaleString()}</span>
                    {m.costPerUnit !== null && <span>${m.costPerUnit.toFixed(2)}/{m.item.unit}</span>}
                  </div>
                  {m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
