"use client";

import { useState } from "react";
import { Gift, UserPlus, Check } from "lucide-react";

export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  becomeMember: boolean;
  isGift: boolean;
  giftRecipientName?: string;
  giftRecipientEmail?: string;
  giftRecipientPhone?: string;
  giftMessage?: string;
  tipAmount: number;
  fulfillmentMethod: 'pickup' | 'delivery';
}

interface EnhancedCheckoutProps {
  totalAmount: number;
  onSubmit: (data: CheckoutFormData) => void;
  onBack: () => void;
  loading?: boolean;
}

export default function EnhancedCheckout({
  totalAmount,
  onSubmit,
  onBack,
  loading = false,
}: EnhancedCheckoutProps) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryInstructions: "",
    becomeMember: false,
    isGift: false,
    giftRecipientName: "",
    giftRecipientEmail: "",
    giftRecipientPhone: "",
    giftMessage: "",
    tipAmount: 0,
    fulfillmentMethod: 'pickup',
  });

  const [tipPercentage, setTipPercentage] = useState(0);

  const updateField = (field: keyof CheckoutFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTip = (percentage: number) => {
    const tipAmount = (totalAmount * percentage) / 100;
    setTipPercentage(percentage);
    updateField("tipAmount", tipAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const grandTotal = totalAmount + formData.tipAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fulfillment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fulfillment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateField("fulfillmentMethod", "pickup")}
            className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
              formData.fulfillmentMethod === "pickup"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            🏪 Pickup
          </button>
          <button
            type="button"
            onClick={() => updateField("fulfillmentMethod", "delivery")}
            className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
              formData.fulfillmentMethod === "delivery"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            🚚 Delivery
          </button>
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Your Information</h3>
        <input
          type="text"
          placeholder="Full Name *"
          value={formData.customerName}
          onChange={(e) => updateField("customerName", e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="email"
          placeholder="Email Address *"
          value={formData.customerEmail}
          onChange={(e) => updateField("customerEmail", e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="tel"
          placeholder="Phone Number *"
          value={formData.customerPhone}
          onChange={(e) => updateField("customerPhone", e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Delivery Address (if delivery selected) */}
      {formData.fulfillmentMethod === "delivery" && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Delivery Details</h3>
          <input
            type="text"
            placeholder="Delivery Address *"
            value={formData.deliveryAddress}
            onChange={(e) => updateField("deliveryAddress", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            placeholder="Delivery Instructions (Optional)"
            value={formData.deliveryInstructions}
            onChange={(e) => updateField("deliveryInstructions", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Become a Member Toggle */}
      <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.becomeMember}
            onChange={(e) => updateField("becomeMember", e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Become a Member</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Save your info for faster checkout next time. Earn points on every order! 🎁
            </p>
          </div>
        </label>
      </div>

      {/* Gift Order Toggle */}
      <div className="border-2 border-dashed border-pink-200 rounded-lg p-4 bg-pink-50/50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isGift}
            onChange={(e) => updateField("isGift", e.target.checked)}
            className="mt-1 w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-gray-900">Send as a Gift</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Surprise someone special! We&apos;ll send the order directly to them.
            </p>
          </div>
        </label>
      </div>

      {/* Gift Recipient Information */}
      {formData.isGift && (
        <div className="space-y-3 pl-8 border-l-4 border-pink-200">
          <h3 className="font-medium text-gray-900">Gift Recipient</h3>
          <input
            type="text"
            placeholder="Recipient Name *"
            value={formData.giftRecipientName}
            onChange={(e) => updateField("giftRecipientName", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="Recipient Email"
            value={formData.giftRecipientEmail}
            onChange={(e) => updateField("giftRecipientEmail", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Recipient Phone *"
            value={formData.giftRecipientPhone}
            onChange={(e) => updateField("giftRecipientPhone", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <textarea
            placeholder="Gift Message (Optional)"
            value={formData.giftMessage}
            onChange={(e) => updateField("giftMessage", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Tip Selection */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Add a Tip (Optional)</h3>
        <div className="grid grid-cols-4 gap-2">
          {[0, 10, 15, 20].map((percentage) => (
            <button
              key={percentage}
              type="button"
              onClick={() => calculateTip(percentage)}
              className={`p-2 border-2 rounded-lg text-sm font-medium transition ${
                tipPercentage === percentage
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {percentage === 0 ? "No Tip" : `${percentage}%`}
            </button>
          ))}
        </div>
        {formData.tipAmount > 0 && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            ${formData.tipAmount.toFixed(2)} tip added
          </p>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        {formData.tipAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Tip</span>
            <span>+${formData.tipAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          Back to Cart
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Proceed to Payment"}
        </button>
      </div>
    </form>
  );
}
