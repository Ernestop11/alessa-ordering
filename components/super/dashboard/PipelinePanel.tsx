"use client";

import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  status: string;
  dealValue: number | null;
  probability: number;
  nextAction: string | null;
  nextActionNote: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialLeads?: Lead[];
}

const STATUS_COLUMNS = [
  { id: 'new', label: 'New Leads', color: 'blue' },
  { id: 'in_progress', label: 'In Progress', color: 'yellow' },
  { id: 'closing', label: 'Closing', color: 'orange' },
  { id: 'converted', label: 'Converted', color: 'green' },
];

export default function PipelinePanel({ initialLeads = [] }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    status: 'new',
    dealValue: '',
    probability: '50',
    notes: '',
    tags: '',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/super/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLead,
          dealValue: newLead.dealValue ? Number(newLead.dealValue) : null,
          probability: Number(newLead.probability),
          tags: newLead.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        await loadLeads();
        setShowAddForm(false);
        setNewLead({
          companyName: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          status: 'new',
          dealValue: '',
          probability: '50',
          notes: '',
          tags: '',
        });
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveLead = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/super/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadLeads();
      }
    } catch (error) {
      console.error('Error moving lead:', error);
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Deal Pipeline</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Add Lead
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddLead} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Company Name"
              value={newLead.companyName}
              onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Contact Name"
              value={newLead.contactName}
              onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Contact Email"
              value={newLead.contactEmail}
              onChange={(e) => setNewLead({ ...newLead, contactEmail: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Contact Phone"
              value={newLead.contactPhone}
              onChange={(e) => setNewLead({ ...newLead, contactPhone: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Deal Value ($)"
              value={newLead.dealValue}
              onChange={(e) => setNewLead({ ...newLead, dealValue: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Probability (%)"
              value={newLead.probability}
              onChange={(e) => setNewLead({ ...newLead, probability: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              min="0"
              max="100"
            />
            <textarea
              placeholder="Notes"
              value={newLead.notes}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newLead.tags}
              onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })}
              className="col-span-2 rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              Add Lead
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          return (
            <div key={column.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{column.label}</h4>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-700">
                  {columnLeads.length}
                </span>
              </div>
              <div className="space-y-2">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                    onClick={() => {
                      // TODO: Open lead detail modal
                    }}
                  >
                    <p className="font-semibold text-gray-900">{lead.companyName}</p>
                    <p className="mt-1 text-xs text-gray-500">{lead.contactName}</p>
                    {lead.dealValue && (
                      <p className="mt-1 text-sm font-semibold text-blue-600">
                        ${lead.dealValue.toLocaleString()}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-1 bg-blue-600"
                          style={{ width: `${lead.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{lead.probability}%</span>
                    </div>
                    {lead.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-1">
                      {STATUS_COLUMNS.filter((c) => c.id !== lead.status).map((col) => (
                        <button
                          key={col.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLead(lead.id, col.id);
                          }}
                          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-200"
                        >
                          →
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {columnLeads.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">No leads</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

