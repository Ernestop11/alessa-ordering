"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Users, Copy, Check, Share2, Clock, MapPin, Calendar, Eye, CreditCard, ChevronRight, ChevronLeft, Building2, Mail } from "lucide-react";
import ContactSelector from "./ContactSelector";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface GroupOrderModalProps {
  open: boolean;
  onClose: () => void;
  tenantSlug: string;
  customDomain?: string | null;
  onViewOrders?: (sessionCode: string) => void;
}

type Step = 'info' | 'contacts' | 'success';

export default function GroupOrderModal({
  open,
  onClose,
  tenantSlug,
  customDomain,
  onViewOrders,
}: GroupOrderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Customer state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [expiresInHours, setExpiresInHours] = useState(2);
  // "I'm Buying" feature
  const [isBuying, setIsBuying] = useState(false);
  const [sponsorDisplayName, setSponsorDisplayName] = useState("");

  // Success state
  const [groupOrderData, setGroupOrderData] = useState<{
    sessionCode: string;
    shareableLink: string;
    expiresAt: string;
    isSponsoredOrder?: boolean;
    sponsorName?: string;
    invitationsCreated?: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch logged-in customer info and contacts
  useEffect(() => {
    async function fetchCustomerData() {
      try {
        const res = await fetch('/api/rewards/customer', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setIsLoggedIn(true);
            // Auto-fill organizer info from logged-in customer
            if (data.name && !organizerName) {
              setOrganizerName(data.name);
              setSponsorDisplayName(data.name);
            }
            if (data.phone && !organizerPhone) {
              setOrganizerPhone(data.phone);
            }
            // Auto-fill company name if saved
            if (data.companyName && !companyName) {
              setCompanyName(data.companyName);
            }
            // Fetch contacts
            fetchContacts();
          }
        }
      } catch (err) {
        console.error('[GroupOrderModal] Failed to fetch customer info:', err);
      }
    }
    fetchCustomerData();
  }, []);

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await fetch('/api/customer/contacts', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('[GroupOrderModal] Failed to fetch contacts:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep('info');
      setError(null);
      setCopied(false);
      setSelectedContactIds(new Set());
    }
  }, [open]);

  if (!open || !mounted) return null;

  const handleAddContact = async (contact: { name: string; email: string; phone?: string }): Promise<Contact | null> => {
    try {
      const res = await fetch('/api/customer/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contact),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add contact');
      }
      // Add to local contacts list
      setContacts(prev => [...prev, data.contact]);
      return data.contact;
    } catch (err) {
      throw err;
    }
  };

  const handleInfoSubmit = () => {
    if (!organizerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setError(null);

    // If logged in and has contacts, show contacts step
    // Otherwise skip to create
    if (isLoggedIn) {
      setStep('contacts');
    } else {
      handleCreateGroupOrder();
    }
  };

  const handleCreateGroupOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build invitees array from selected contacts
      const invitees = Array.from(selectedContactIds).map(id => {
        const contact = contacts.find(c => c.id === id);
        return contact ? {
          contactId: contact.id,
          name: contact.name,
          email: contact.email,
        } : null;
      }).filter(Boolean);

      const response = await fetch("/api/group-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          companyName: companyName.trim() || null,
          organizerName: organizerName.trim(),
          organizerPhone: organizerPhone.trim() || null,
          fulfillmentMethod,
          expiresInHours,
          isSponsoredOrder: isBuying,
          sponsorName: isBuying ? (sponsorDisplayName.trim() || organizerName.trim()) : null,
          invitees,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group order");
      }

      setGroupOrderData({
        sessionCode: data.sessionCode,
        shareableLink: data.shareableLink,
        expiresAt: data.expiresAt,
        isSponsoredOrder: data.isSponsoredOrder,
        sponsorName: data.sponsorName,
        invitationsCreated: data.invitationsCreated,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group order");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!groupOrderData) return;

    try {
      await navigator.clipboard.writeText(groupOrderData.shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = groupOrderData.shareableLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!groupOrderData) return;

    const shareText = `Join my group order at ${companyName || 'our team'}! Order before it closes.\n\n${groupOrderData.shareableLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Group Order - ${companyName || 'Group Order'}`,
          text: shareText,
          url: groupOrderData.shareableLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const formatExpiryTime = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStepTitle = () => {
    switch (step) {
      case 'info': return 'Start Group Order';
      case 'contacts': return 'Invite Team';
      case 'success': return 'Share Your Link';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'info': return 'Create a link for your team to order together';
      case 'contacts': return 'Select contacts to invite (optional)';
      case 'success': return 'Send this link to your group';
    }
  };

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
      className="flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        style={{ zIndex: 9999, maxHeight: '90vh' }}
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{getStepTitle()}</h2>
              <p className="text-sm text-white/50">{getStepSubtitle()}</p>
            </div>
          </div>

          {/* Step Indicator */}
          {step !== 'success' && isLoggedIn && (
            <div className="flex items-center gap-2 mt-4">
              <div className={`h-1 flex-1 rounded-full ${step === 'info' ? 'bg-amber-500' : 'bg-white/20'}`} />
              <div className={`h-1 flex-1 rounded-full ${step === 'contacts' ? 'bg-amber-500' : 'bg-white/20'}`} />
            </div>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 overflow-y-auto flex-1">
          {step === 'info' && (
            <div className="space-y-4">
              {/* Company/Office Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  <Building2 className="w-4 h-4 inline-block mr-1" />
                  Company / Office Name <span className="text-white/40">(optional)</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Acme Corp, Marketing Team"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              {/* Organizer Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Phone Number <span className="text-white/40">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                  placeholder="For order updates"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>

              {/* Fulfillment Method */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  How will everyone get their food?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod('pickup')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      fulfillmentMethod === 'pickup'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod('delivery')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      fulfillmentMethod === 'delivery'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Delivery</span>
                  </button>
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  <Clock className="w-4 h-4 inline-block mr-1" />
                  Order window closes in
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setExpiresInHours(hours)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        expiresInHours === hours
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              {/* I'm Buying Toggle */}
              <div className={`rounded-xl border-2 p-4 transition-all ${
                isBuying
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-dashed border-white/20 bg-white/5'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBuying}
                    onChange={(e) => setIsBuying(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-white/30 bg-white/10 text-green-500 focus:ring-green-500/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-green-400" />
                      <span className="font-semibold text-white">I&apos;m buying for everyone</span>
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      You&apos;ll pay for the entire group order. Others just add items.
                    </p>
                  </div>
                </label>

                {isBuying && (
                  <div className="mt-3 pl-8">
                    <input
                      type="text"
                      value={sponsorDisplayName}
                      onChange={(e) => setSponsorDisplayName(e.target.value)}
                      placeholder={organizerName.trim() || "Your name"}
                      className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 text-sm"
                    />
                    <p className="text-xs text-white/40 mt-1.5">
                      Shown as &ldquo;{sponsorDisplayName.trim() || organizerName.trim() || 'Boss'}&apos;s buying!&rdquo; to participants
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleInfoSubmit}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-black/90 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggedIn ? (
                  <>
                    Next: Invite Team
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  "Create Group Order Link"
                )}
              </button>
            </div>
          )}

          {step === 'contacts' && (
            <div className="space-y-4">
              {/* Contact Selector */}
              <ContactSelector
                contacts={contacts}
                selectedIds={selectedContactIds}
                onSelectionChange={setSelectedContactIds}
                onAddContact={handleAddContact}
                loading={contactsLoading}
              />

              {/* Info about invitations */}
              {selectedContactIds.size > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-400/80">
                    {selectedContactIds.size} contact{selectedContactIds.size > 1 ? 's' : ''} will receive an email invitation with a personalized link.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="flex-1 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroupOrder}
                  disabled={loading}
                  className="flex-[2] py-3 rounded-xl font-bold text-black/90 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : selectedContactIds.size > 0 ? (
                    `Create & Send ${selectedContactIds.size} Invite${selectedContactIds.size > 1 ? 's' : ''}`
                  ) : (
                    "Skip & Create Link"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-5">
              {/* Success Message */}
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Group Order Created!
                </h3>
                <p className="text-white/50 text-sm">
                  {groupOrderData?.invitationsCreated && groupOrderData.invitationsCreated > 0
                    ? `${groupOrderData.invitationsCreated} invitation${groupOrderData.invitationsCreated > 1 ? 's' : ''} sent!`
                    : 'Share the link below with your group'}
                </p>
              </div>

              {/* Session Code Badge */}
              <div className="flex items-center justify-center">
                <div className="px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <span className="text-amber-400 font-mono font-bold text-lg">
                    {groupOrderData?.sessionCode}
                  </span>
                </div>
              </div>

              {/* Link Box */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-2">Shareable Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={groupOrderData?.shareableLink || ''}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-all ${
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expiry Info */}
              <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  Closes at {groupOrderData ? formatExpiryTime(groupOrderData.expiresAt) : ''}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-black/90 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/30 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                  <button
                    onClick={onClose}
                    className="py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                  >
                    Done
                  </button>
                </div>
                {onViewOrders && groupOrderData && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewOrders(groupOrderData.sessionCode);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Incoming Orders
                  </button>
                )}
              </div>

              {/* Tip - different for sponsored orders */}
              {groupOrderData?.isSponsoredOrder ? (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                  <p className="text-sm text-green-400 font-medium">
                    {groupOrderData.sponsorName}&apos;s buying!
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Participants add items - you&apos;ll pay for everyone when ready.
                  </p>
                </div>
              ) : (
                <p className="text-center text-xs text-white/40">
                  Everyone pays for their own order. All orders are grouped for pickup/delivery.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
