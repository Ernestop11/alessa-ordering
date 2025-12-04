'use client';

import { useState, useEffect } from 'react';

interface UplineNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  rank: string;
  level: number;
  totalEarnings: number;
  totalRecruits: number;
  activeRecruits: number;
  sponsorId: string | null;
}

interface Props {
  associateId: string;
}

const RANK_ICONS: Record<string, string> = {
  REP: '⭐',
  SENIOR_REP: '🌟',
  SUPERVISOR: '🎖️',
  MANAGER: '🏅',
  SENIOR_MANAGER: '🥇',
  DIRECTOR: '👔',
  SENIOR_DIRECTOR: '💼',
  VP: '🎩',
  SVP: '👑',
};

export default function UplineView({ associateId }: Props) {
  const [upline, setUpline] = useState<UplineNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpline();
  }, [associateId]);

  const loadUpline = async () => {
    try {
      const res = await fetch(`/api/mlm/upline?associateId=${associateId}`);
      if (res.ok) {
        const data = await res.json();
        setUpline(data);
      }
    } catch (error) {
      console.error('Error loading upline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (upline.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No upline found (you might be at the top!)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Upline Chain</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your sponsors and leaders who support your success
        </p>
      </div>

      <div className="space-y-3">
        {upline.map((member, index) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{RANK_ICONS[member.rank] || '⭐'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{member.name}</span>
                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                    {member.rank}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                      Founder
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {member.email} • Level {member.level}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="font-semibold text-gray-700">
                    💰 ${member.totalEarnings.toFixed(2)}
                  </span>
                  <span className="font-semibold text-gray-700">
                    👥 {member.totalRecruits} recruits
                  </span>
                  <span className="font-semibold text-gray-700">
                    ✅ {member.activeRecruits} active
                  </span>
                </div>
              </div>
            </div>
            {index < upline.length - 1 && (
              <div className="text-2xl text-purple-300">↓</div>
            )}
          </div>
        ))}
      </div>

      {/* MLM Principle Quote */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <p className="text-sm italic text-gray-700">
          &quot;Your network is your net worth.&quot; - <span className="font-semibold">Jim Rohn</span>
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Your upline is here to support your success. Reach out to them for guidance, training, and motivation.
        </p>
      </div>
    </div>
  );
}

