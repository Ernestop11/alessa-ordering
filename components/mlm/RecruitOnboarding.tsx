'use client';

import { useState } from 'react';

interface Props {
  sponsorId: string;
  onSuccess?: () => void;
}

export default function RecruitOnboarding({ sponsorId, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/mlm/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referralCode: '', // Will use sponsor's code
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Success! Schedule urgent meeting
      try {
        await fetch('/api/mlm/meetings/invite-urgent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newRecruitId: data.id,
            sponsorId,
          }),
        });
      } catch (meetingError) {
        console.error('Error scheduling meeting:', meetingError);
        // Don't fail registration if meeting scheduling fails
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setError('An error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h3>
        <p className="text-gray-700 mb-4">
          Your account has been created. Check your email for your first meeting invitation!
        </p>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">Next Steps:</p>
          <ol className="text-left text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Check your email for meeting details</li>
            <li>Attend your first orientation meeting (within 48 hours)</li>
            <li>Complete your training modules</li>
            <li>Start sharing your referral code</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MLM Principle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">👥 Recruit a New Associate</h3>
        <p className="text-sm text-gray-700 italic mb-2">
          &quot;The only way to do great work is to love what you do.&quot; - <span className="font-semibold">Steve Jobs</span>
        </p>
        <p className="text-sm text-gray-600">
          Help someone start their journey. They'll be automatically invited to their first meeting within 48 hours.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : '🚀 Onboard New Recruit'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By creating an account, the new recruit agrees to attend their first meeting within 48 hours.
        </p>
      </form>
    </div>
  );
}

