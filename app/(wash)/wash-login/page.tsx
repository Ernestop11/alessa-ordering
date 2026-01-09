"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WashLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams?.get("tenant") || "rhinopowerwashing";

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinChange = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError("Please enter 4 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/wash/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, tenantSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setPin("");
        return;
      }

      // Store employee info in localStorage
      localStorage.setItem("washEmployee", JSON.stringify(data.employee));

      // Redirect based on role
      if (data.employee.role === "owner" || data.employee.role === "staff") {
        router.push(`/wash-dashboard?tenant=${tenantSlug}`);
      } else {
        router.push(`/wash-clock?tenant=${tenantSlug}`);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when 4 digits entered
  if (pin.length === 4 && !loading) {
    handleLogin();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Logo/Title */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-blue-600 rounded-2xl flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Rhino Power Washing</h1>
        <p className="text-slate-400 mt-2">Enter your PIN to login</p>
        <p className="text-slate-500 text-sm mt-1">(Last 4 digits of your phone)</p>
      </div>

      {/* PIN Display */}
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
              pin[i]
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-500 border-2 border-slate-600"
            }`}
          >
            {pin[i] ? "●" : ""}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-4 text-blue-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handlePinChange(String(digit))}
            disabled={loading}
            className="w-20 h-16 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-xl text-white text-2xl font-semibold transition-all disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={loading}
          className="w-20 h-16 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 text-sm font-medium transition-all disabled:opacity-50"
        >
          Clear
        </button>
        <button
          onClick={() => handlePinChange("0")}
          disabled={loading}
          className="w-20 h-16 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-xl text-white text-2xl font-semibold transition-all disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={loading}
          className="w-20 h-16 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-all disabled:opacity-50"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <p className="mt-8 text-slate-600 text-xs">
        Employee Time Clock System
      </p>
    </div>
  );
}
