'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const schema = z.object({
  technicalRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  problemSolvingRating: z.number().min(1).max(5),
  recommendation: z.enum(['hire', 'no_hire']),
  writtenFeedback: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FeedbackPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user, loading } = useAuth(true);
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      technicalRating: 3,
      communicationRating: 3,
      problemSolvingRating: 3,
      recommendation: 'hire',
    },
  });

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await api(`/api/feedback/${interviewId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  const RatingSelect = ({ name, label }: { name: keyof FormData; label: string }) => (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <select {...register(name, { valueAsNumber: true })} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Submit Feedback</h1>
      {success ? (
        <p className="mt-4 text-green-400">Feedback submitted! Redirecting...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <RatingSelect name="technicalRating" label="Technical Skills" />
          <RatingSelect name="communicationRating" label="Communication" />
          <RatingSelect name="problemSolvingRating" label="Problem Solving" />
          <div>
            <label className="text-sm text-gray-400">Recommendation</label>
            <select {...register('recommendation')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
              <option value="hire">Hire</option>
              <option value="no_hire">No Hire</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Written Feedback</label>
            <textarea {...register('writtenFeedback')} rows={4} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded bg-primary py-2 hover:bg-primary-dark disabled:opacity-50">
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
