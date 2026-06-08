'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number().min(15).max(240),
  language: z.string(),
  interviewerId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

type FormData = z.infer<typeof schema>;

interface User {
  id: string;
  email: string;
  role: string;
  display_name: string;
}

export default function SchedulePage() {
  const { user, loading } = useAuth(true);
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { durationMinutes: 60, language: 'javascript' },
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      api<User[]>('/api/users').then(setUsers).catch(() => {});
    } else if (user?.role === 'interviewer') {
      api<User[]>('/api/users/candidates').then(setUsers).catch(() => {});
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (user?.role !== 'admin' && user?.role !== 'interviewer') {
    return <div className="p-8 text-center text-red-400">Access denied</div>;
  }

  const interviewers = users.filter((u) => u.role === 'interviewer' || u.role === 'admin');
  const candidates = users.filter((u) => u.role === 'candidate');

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const interviewerId = user?.role === 'interviewer' ? user.id : data.interviewerId;
      await api('/api/interviews', {
        method: 'POST',
        body: JSON.stringify({ ...data, interviewerId }),
      });
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to schedule');
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Schedule Interview</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-gray-400">Title</label>
          <input {...register('title')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Description</label>
          <textarea {...register('description')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Date & Time</label>
          <input type="datetime-local" {...register('scheduledAt')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Duration (minutes)</label>
          <input type="number" {...register('durationMinutes', { valueAsNumber: true })} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Language</label>
          <select {...register('language')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
        </div>
        {user?.role === 'admin' && (
          <>
            <div>
              <label className="text-sm text-gray-400">Interviewer</label>
              <select {...register('interviewerId')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
                {interviewers.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Candidate</label>
              <select {...register('candidateId')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name} ({u.email})</option>
                ))}
              </select>
            </div>
          </>
        )}
        {user?.role === 'interviewer' && (
          <div>
            <label className="text-sm text-gray-400">Candidate</label>
            <select {...register('candidateId')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.display_name} ({u.email})</option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full rounded bg-primary py-2 hover:bg-primary-dark disabled:opacity-50">
          {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
        </button>
      </form>
    </div>
  );
}
