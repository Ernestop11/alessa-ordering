'use client';

import { useState, useEffect } from 'react';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  location: string | null;
  status: string;
  host: {
    id: string;
    name: string;
    rank: string;
  };
  attendeeStatus: string;
  confirmedAt: string | null;
}

interface Props {
  associateId: string;
}

export default function MeetingsSchedule({ associateId }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [associateId]);

  const loadMeetings = async () => {
    try {
      const res = await fetch(`/api/mlm/meetings?associateId=${associateId}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAttendance = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/mlm/meetings/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, associateId }),
      });
      if (res.ok) {
        loadMeetings(); // Reload
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const upcoming = meetings.filter((m) => new Date(m.scheduledAt) >= new Date());
  const past = meetings.filter((m) => new Date(m.scheduledAt) < new Date());

  return (
    <div className="space-y-6">
      {/* MLM Principle */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📅 Meeting Protocol</h3>
        <p className="text-sm text-gray-700 italic mb-2">
          &quot;Success is nothing more than a few simple disciplines, practiced every day.&quot; - <span className="font-semibold">Jim Rohn</span>
        </p>
        <p className="text-sm text-gray-600">
          <strong>MLM Best Practice:</strong> Attend meetings regularly to learn, network, and grow. 
          New recruits should attend their first meeting within 48 hours.
        </p>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-4">Upcoming Meetings</h4>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No upcoming meetings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((meeting) => (
              <div
                key={meeting.id}
                className={`rounded-lg border-2 p-6 ${
                  meeting.attendeeStatus === 'confirmed'
                    ? 'bg-green-50 border-green-300'
                    : meeting.attendeeStatus === 'invited'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {meeting.type === 'training' ? '📚' :
                         meeting.type === 'sales' ? '💼' :
                         meeting.type === 'recruiting' ? '👥' :
                         meeting.type === 'leadership' ? '👔' : '📅'}
                      </span>
                      <h5 className="font-bold text-lg">{meeting.title}</h5>
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                        {meeting.type}
                      </span>
                    </div>
                    {meeting.description && (
                      <p className="text-gray-700 mb-3">{meeting.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Date & Time:</span>
                        <p className="text-gray-600">
                          {new Date(meeting.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Host:</span>
                        <p className="text-gray-600">
                          {meeting.host.name} ({meeting.host.rank})
                        </p>
                      </div>
                      {meeting.meetingUrl && (
                        <div>
                          <span className="font-semibold text-gray-700">Meeting Link:</span>
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block"
                          >
                            Join Meeting →
                          </a>
                        </div>
                      )}
                      {meeting.location && (
                        <div>
                          <span className="font-semibold text-gray-700">Location:</span>
                          <p className="text-gray-600">{meeting.location}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        meeting.attendeeStatus === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : meeting.attendeeStatus === 'attended'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {meeting.attendeeStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {meeting.attendeeStatus === 'invited' && (
                    <button
                      onClick={() => confirmAttendance(meeting.id)}
                      className="ml-4 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow-lg"
                    >
                      Confirm Attendance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {past.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4">Past Meetings</h4>
          <div className="space-y-3">
            {past.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900">{meeting.title}</h5>
                    <p className="text-sm text-gray-600">
                      {new Date(meeting.scheduledAt).toLocaleDateString()} • {meeting.host.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    meeting.attendeeStatus === 'attended'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {meeting.attendeeStatus === 'attended' ? 'Attended' : 'Missed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

