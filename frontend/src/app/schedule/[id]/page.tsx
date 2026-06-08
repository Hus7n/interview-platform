'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number().min(15).max(240),
  language: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Interview {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  language: string;
  status: string;
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth(true);
  const router = useRouter();
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!id || !user) return;
    api<Interview>(`/api/interviews/${id}`)
      .then((interview) => {
        if (interview.status === 'cancelled') {
          setError('This interview has been cancelled and cannot be edited.');
        } else {
        reset({
          title: interview.title,
          description: interview.description || '',
          scheduledAt: toDatetimeLocal(interview.scheduled_at),
          durationMinutes: interview.duration_minutes,
          language: interview.language,
        });
        setLoaded(true);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load interview'))
      .finally(() => setFetching(false));
  }, [id, user, reset]);

  if (loading || fetching) return <div className="p-8 text-center">Loading...</div>;
  if (user?.role !== 'admin' && user?.role !== 'interviewer') {
    return <div className="p-8 text-center text-red-400">Access denied</div>;
  }

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await api(`/api/interviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update interview');
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Interview</h1>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary">
          Back to dashboard
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loaded && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <button type="submit" disabled={isSubmitting} className="w-full rounded bg-primary py-2 hover:bg-primary-dark disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}

