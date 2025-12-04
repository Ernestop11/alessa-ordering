'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  associateName: string;
  associateRank: string;
  score: number;
  metadata: {
    salesCount?: number;
    recruitsCount?: number;
    totalEarnings?: number;
    points?: number;
  };
}

interface Props {
  associateId: string;
  contestId?: string;
}

export default function ContestLeaderboard({ associateId, contestId }: Props) {
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, [associateId]);

  useEffect(() => {
    if (selectedLeaderboard) {
      loadLeaderboardEntries(selectedLeaderboard);
    }
  }, [selectedLeaderboard]);

  const loadLeaderboards = async () => {
    try {
      const res = await fetch(`/api/mlm/leaderboards?associateId=${associateId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboards(data.leaderboards || []);
        if (data.leaderboards && data.leaderboards.length > 0) {
          setSelectedLeaderboard(data.leaderboards[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboardEntries = async (leaderboardId: string) => {
    try {
      const res = await fetch(`/api/mlm/leaderboards/${leaderboardId}/entries`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border-2 border-amber-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">🏆 Contest Leaderboards</h3>
        <p className="text-sm text-gray-700 italic">
          &quot;Competition is a good thing. It forces us to do our best.&quot; - <span className="font-semibold">John Maxwell</span>
        </p>
      </div>

      {/* Leaderboard Selector */}
      {leaderboards.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {leaderboards.map((lb) => (
            <button
              key={lb.id}
              onClick={() => setSelectedLeaderboard(lb.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                selectedLeaderboard === lb.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {lb.name} ({lb.period})
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard Table */}
      {entries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Associate</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Rank</th>
                  <th className="px-6 py-4 text-right text-sm font-bold">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {getRankIcon(entry.rank)}
                        </span>
                        {index >= 3 && (
                          <span className="text-lg font-bold text-gray-700">#{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{entry.associateName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                        {entry.associateRank}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-lg text-gray-900">
                        {typeof entry.score === 'number' && entry.score % 1 !== 0
                          ? `$${entry.score.toFixed(2)}`
                          : entry.score.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.metadata.salesCount && `${entry.metadata.salesCount} sales`}
                      {entry.metadata.recruitsCount && `${entry.metadata.recruitsCount} recruits`}
                      {entry.metadata.points && `${entry.metadata.points} points`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No leaderboard entries yet</p>
        </div>
      )}
    </div>
  );
}

