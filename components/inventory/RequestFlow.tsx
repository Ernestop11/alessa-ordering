'use client';

import { useState, useEffect, useCallback } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
}

interface Department {
  id: string;
  name: string;
  type: string;
}

interface RequestItem {
  id: string;
  itemId: string;
  quantityRequested: number;
  quantityFulfilled: number | null;
  item: { id: string; name: string; unit: string; currentStock: number };
}

interface InventoryRequest {
  id: string;
  fromSectionId: string;
  toSectionId: string;
  fromSection: { name: string };
  toSection: { name: string };
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  items: RequestItem[];
}

interface RequestFlowProps {
  tenantSlug: string;
  departmentId: string;
  departmentName: string;
  departments: Department[];
  items: InventoryItem[];
  onRefresh: () => void;
}

export default function RequestFlow({
  tenantSlug,
  departmentId,
  departmentName,
  departments,
  items,
  onRefresh,
}: RequestFlowProps) {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New request form state
  const [targetDeptId, setTargetDeptId] = useState('');
  const [requestItems, setRequestItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [requestNotes, setRequestNotes] = useState('');
  const [requestedBy, setRequestedBy] = useState('');

  const authParam = `tenantSlug=${tenantSlug}`;

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory/requests?departmentId=${departmentId}&${authParam}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, authParam]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const otherDepts = departments.filter((d) => d.id !== departmentId);

  // Requests made BY this department (outgoing)
  const outgoing = requests.filter((r) => r.fromSectionId === departmentId);
  // Requests made TO this department (incoming - they need to supply items)
  const incoming = requests.filter((r) => r.toSectionId === departmentId);

  const addRequestItem = () => {
    setRequestItems([...requestItems, { itemId: '', quantity: 1 }]);
  };

  const removeRequestItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const updateRequestItem = (index: number, field: 'itemId' | 'quantity', value: string | number) => {
    const updated = [...requestItems];
    updated[index] = { ...updated[index], [field]: value };
    setRequestItems(updated);
  };

  const submitRequest = async () => {
    if (!targetDeptId || requestItems.length === 0 || !requestedBy) return;

    const validItems = requestItems.filter((ri) => ri.itemId && ri.quantity > 0);
    if (validItems.length === 0) return;

    setActionLoading('submit');
    try {
      const res = await fetch(`/api/inventory/requests?${authParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSectionId: departmentId,
          toSectionId: targetDeptId,
          items: validItems.map((ri) => ({ itemId: ri.itemId, quantity: ri.quantity })),
          notes: requestNotes || null,
          requestedBy,
        }),
      });

      if (res.ok) {
        setShowNewRequest(false);
        setTargetDeptId('');
        setRequestItems([]);
        setRequestNotes('');
        fetchRequests();
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit request');
      }
    } catch (err) {
      alert('Failed to submit request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'fulfill') => {
    setActionLoading(requestId);
    try {
      if (action === 'fulfill') {
        const res = await fetch(`/api/inventory/requests/${requestId}/fulfill?${authParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Failed to fulfill');
          return;
        }
      } else {
        const res = await fetch(`/api/inventory/requests/${requestId}?${authParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || `Failed to ${action}`);
          return;
        }
      }
      fetchRequests();
      onRefresh();
    } catch (err) {
      alert(`Failed to ${action} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-900/50 text-yellow-400';
      case 'APPROVED': return 'bg-blue-900/50 text-blue-400';
      case 'FULFILLED': return 'bg-green-900/50 text-green-400';
      case 'REJECTED': return 'bg-red-900/50 text-red-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

  const renderRequest = (req: InventoryRequest, type: 'incoming' | 'outgoing') => (
    <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
            {req.status}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(req.createdAt).toLocaleDateString()}
          </span>
        </div>
        <span className="text-xs text-gray-400">by {req.requestedBy}</span>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="font-medium text-purple-400">{req.fromSection.name}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span className="font-medium text-cyan-400">{req.toSection.name}</span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {req.items.map((ri) => (
          <div key={ri.id} className="flex items-center justify-between text-sm bg-gray-800/50 rounded-lg px-3 py-2">
            <span>{ri.item.name}</span>
            <span className="text-gray-400">
              {ri.quantityFulfilled !== null
                ? `${ri.quantityFulfilled} / ${ri.quantityRequested} ${ri.item.unit}`
                : `${ri.quantityRequested} ${ri.item.unit}`
              }
            </span>
          </div>
        ))}
      </div>

      {req.notes && (
        <p className="text-xs text-gray-500 mb-3">Note: {req.notes}</p>
      )}

      {/* Actions for incoming requests (this dept is the supplier) */}
      {type === 'incoming' && req.status === 'PENDING' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(req.id, 'approve')}
            disabled={actionLoading === req.id}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(req.id, 'reject')}
            disabled={actionLoading === req.id}
            className="flex-1 py-2 bg-red-600/20 border border-red-700 text-red-400 text-sm rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {type === 'incoming' && req.status === 'APPROVED' && (
        <button
          onClick={() => handleAction(req.id, 'fulfill')}
          disabled={actionLoading === req.id}
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {actionLoading === req.id ? 'Processing...' : 'Fulfill & Transfer Stock'}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* New Request Button */}
      <button
        onClick={() => { setShowNewRequest(true); addRequestItem(); }}
        className="w-full mb-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-base font-medium transition-colors touch-manipulation"
      >
        + New Request to Another Department
      </button>

      {/* New Request Form */}
      {showNewRequest && (
        <div className="bg-gray-900 border border-purple-700/50 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Request Items From:</h3>

          {/* Your Name */}
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              placeholder="e.g., Maria"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>

          {/* Target Department */}
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">Request From</label>
            <select
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">Select department...</option>
              {otherDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-3">
            {requestItems.map((ri, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={ri.itemId}
                  onChange={(e) => updateRequestItem(index, 'itemId', e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                >
                  <option value="">Select item...</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={ri.quantity}
                  onChange={(e) => updateRequestItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0.1"
                  step="0.1"
                  className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm text-center"
                />
                <button
                  onClick={() => removeRequestItem(index)}
                  className="px-3 py-2 bg-red-900/30 text-red-400 rounded-lg text-sm"
                >
                  X
                </button>
              </div>
            ))}
            <button
              onClick={addRequestItem}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              + Add another item
            </button>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <input
              type="text"
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
            />
          </div>

          {/* Submit / Cancel */}
          <div className="flex gap-2">
            <button
              onClick={submitRequest}
              disabled={!targetDeptId || requestItems.length === 0 || !requestedBy || actionLoading === 'submit'}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'submit' ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => { setShowNewRequest(false); setRequestItems([]); }}
              className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Incoming Requests (this dept needs to supply) */}
      {incoming.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Incoming Requests ({incoming.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED').length} active)
          </h3>
          <div className="space-y-3">
            {incoming.map((req) => renderRequest(req, 'incoming'))}
          </div>
        </div>
      )}

      {/* Outgoing Requests (this dept requested from others) */}
      {outgoing.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Your Requests ({outgoing.filter((r) => r.status === 'PENDING').length} pending)
          </h3>
          <div className="space-y-3">
            {outgoing.map((req) => renderRequest(req, 'outgoing'))}
          </div>
        </div>
      )}

      {incoming.length === 0 && outgoing.length === 0 && !showNewRequest && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No requests yet</p>
          <p className="text-sm">Create a request to get items from another department</p>
        </div>
      )}
    </div>
  );
}
