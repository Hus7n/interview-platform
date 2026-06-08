'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Interview {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  room_id: string;
  created_by?: string;
  participant_role?: string;
}

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!user) return;
    api<Interview[]>('/api/interviews').then(setInterviews).catch(() => {});
    api<Notification[]>('/api/notifications').then(setNotifications).catch(() => {});
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canManage = (interview: Interview) => {
    if (interview.status !== 'scheduled') return false;
    if (user?.role === 'admin') return true;
    if (user?.role === 'interviewer' && interview.created_by === user.id) return true;
    return false;
  };

  const handleCancel = async (interview: Interview) => {
    const confirmed = window.confirm(`Cancel interview "${interview.title}"?`);
    if (!confirmed) return;

    setActionError('');
    setCancellingId(interview.id);
    try {
      await api(`/api/interviews/${interview.id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to cancel interview');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const upcoming = interviews.filter((i) => i.status === 'scheduled' || i.status === 'in_progress');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {(user?.role === 'admin' || user?.role === 'interviewer') && (
          <Link href="/schedule" className="rounded bg-primary px-4 py-2 text-sm hover:bg-primary-dark">
            Schedule Interview
          </Link>
        )}
      </div>

      {actionError && (
        <p className="mt-4 rounded border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-400">
          {actionError}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Upcoming Interviews</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400">No upcoming interviews.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-surface p-4">
                  <div>
                    <h3 className="font-medium">{i.title}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(i.scheduled_at).toLocaleString()} · {i.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage(i) && (
                      <>
                        <Link
                          href={`/schedule/${i.id}`}
                          className="rounded border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleCancel(i)}
                          disabled={cancellingId === i.id}
                          className="rounded border border-red-800 px-3 py-1 text-sm text-red-400 hover:bg-red-950 disabled:opacity-50"
                        >
                          {cancellingId === i.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    )}
                    {i.status !== 'cancelled' && (
                      <Link
                        href={`/interview/${i.room_id}`}
                        className="rounded bg-primary px-3 py-1 text-sm hover:bg-primary-dark"
                      >
                        Join
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-4 mt-8 text-lg font-semibold">All Interviews</h2>
          <div className="space-y-2">
            {interviews.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded border border-gray-800 px-4 py-2 text-sm">
                <div>
                  <span>{i.title}</span>
                  <span className="ml-2 text-gray-500">
                    {new Date(i.scheduled_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    i.status === 'cancelled' ? 'bg-red-950 text-red-400' :
                    i.status === 'completed' ? 'bg-green-950 text-green-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {i.status}
                  </span>
                  {canManage(i) && (
                    <>
                      <Link href={`/schedule/${i.id}`} className="text-primary hover:underline">Edit</Link>
                      <button
                        onClick={() => handleCancel(i)}
                        disabled={cancellingId === i.id}
                        className="text-red-400 hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {i.status === 'completed' && user?.role !== 'candidate' && (
                    <Link href={`/feedback/${i.id}`} className="text-primary hover:underline">Feedback</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400">No notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded border border-gray-800 p-3 text-sm ${!n.is_read ? 'bg-gray-900' : ''}`}
                >
                  {n.message}
                  <p className="mt-1 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
