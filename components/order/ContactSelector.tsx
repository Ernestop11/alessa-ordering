"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Check, Users, X, UserPlus, Smartphone } from "lucide-react";

// Type definitions for Contact Picker API
interface ContactPickerContact {
  name?: string[];
  email?: string[];
  tel?: string[];
}

declare global {
  interface Navigator {
    contacts?: {
      select: (
        properties: string[],
        options?: { multiple?: boolean }
      ) => Promise<ContactPickerContact[]>;
      getProperties: () => Promise<string[]>;
    };
  }
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface ContactSelectorProps {
  contacts: Contact[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onAddContact: (contact: { name: string; email: string; phone?: string }) => Promise<Contact | null>;
  loading?: boolean;
}

export default function ContactSelector({
  contacts,
  selectedIds,
  onSelectionChange,
  onAddContact,
  loading = false,
}: ContactSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [addingContact, setAddingContact] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [hasContactPicker, setHasContactPicker] = useState(false);
  const [importingContact, setImportingContact] = useState(false);

  // Check if Contact Picker API is available
  useEffect(() => {
    setHasContactPicker("contacts" in navigator && "select" in (navigator.contacts || {}));
  }, []);

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      (contact.phone?.includes(query) ?? false)
    );
  });

  const toggleContact = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    const allIds = new Set(filteredContacts.map((c) => c.id));
    onSelectionChange(allIds);
  };

  const deselectAll = () => {
    onSelectionChange(new Set());
  };

  // Import contact from device
  const handleImportFromPhone = async () => {
    if (!navigator.contacts) {
      setAddError("Contact picker not available");
      return;
    }

    setImportingContact(true);
    setAddError(null);

    try {
      const contacts = await navigator.contacts.select(
        ["name", "email", "tel"],
        { multiple: false }
      );

      if (contacts.length > 0) {
        const contact = contacts[0];
        const name = contact.name?.[0] || "";
        const email = contact.email?.[0] || "";
        const phone = contact.tel?.[0] || "";

        // Populate form with imported data
        setNewContact({
          name,
          email,
          phone,
        });
        setShowAddForm(true);

        // If we have enough info, show success message
        if (!email) {
          setAddError("No email found for this contact. Please enter manually.");
        }
      }
    } catch (err) {
      // User cancelled or error
      if (err instanceof Error && err.name !== "AbortError") {
        setAddError("Failed to import contact");
      }
    } finally {
      setImportingContact(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.email.trim()) {
      setAddError("Name and email are required");
      return;
    }

    setAddingContact(true);
    setAddError(null);

    try {
      const contact = await onAddContact({
        name: newContact.name.trim(),
        email: newContact.email.trim(),
        phone: newContact.phone.trim() || undefined,
      });

      if (contact) {
        // Auto-select the new contact
        const newSelection = new Set(selectedIds);
        newSelection.add(contact.id);
        onSelectionChange(newSelection);

        // Reset form
        setNewContact({ name: "", email: "", phone: "" });
        setShowAddForm(false);
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setAddingContact(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/70">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : `${contacts.length} contacts`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-white/50 hover:text-white/70"
            >
              Deselect all
            </button>
          ) : (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Invite all
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-sm"
        />
      </div>

      {/* Contact List */}
      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/40 text-sm">
              {contacts.length === 0
                ? "No contacts yet. Add your first contact below."
                : "No contacts match your search"}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => toggleContact(contact.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedIds.has(contact.id)
                  ? "bg-amber-500/20 border-amber-500/50"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedIds.has(contact.id)
                    ? "bg-amber-500 border-amber-500"
                    : "border-white/30"
                }`}
              >
                {selectedIds.has(contact.id) && (
                  <Check className="w-3 h-3 text-black" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">{contact.name}</p>
                <p className="text-white/50 text-xs">{contact.email}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Add Contact Form */}
      {showAddForm ? (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Add New Contact</span>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewContact({ name: "", email: "", phone: "" });
                setAddError(null);
              }}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Import from Phone button (shown inside form on supported devices) */}
          {hasContactPicker && (
            <button
              type="button"
              onClick={handleImportFromPhone}
              disabled={importingContact}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 font-medium text-sm hover:bg-blue-500/30 disabled:opacity-50 transition-all border border-blue-500/30"
            >
              <Smartphone className="w-4 h-4" />
              {importingContact ? "Opening contacts..." : "Import from Phone"}
            </button>
          )}

          <input
            type="text"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            placeholder="Name *"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none text-sm"
          />
          <input
            type="email"
            value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            placeholder="Email *"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none text-sm"
          />
          <input
            type="tel"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            placeholder="Phone (optional)"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none text-sm"
          />

          {addError && (
            <p className="text-red-400 text-xs">{addError}</p>
          )}

          <button
            type="button"
            onClick={handleAddContact}
            disabled={addingContact}
            className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-400 font-medium text-sm hover:bg-amber-500/30 disabled:opacity-50 transition-all"
          >
            {addingContact ? "Adding..." : "Add & Select"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Import from Phone - Primary action on supported devices */}
          {hasContactPicker && (
            <button
              type="button"
              onClick={handleImportFromPhone}
              disabled={importingContact}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600/30 to-blue-500/20 border border-blue-500/40 text-blue-300 hover:from-blue-600/40 hover:to-blue-500/30 disabled:opacity-50 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">
                {importingContact ? "Opening contacts..." : "Import from Phone"}
              </span>
            </button>
          )}

          {/* Manual add button */}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:text-white/70 hover:border-white/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Manually</span>
          </button>
        </div>
      )}
    </div>
  );
}
