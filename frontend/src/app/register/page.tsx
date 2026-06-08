'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  role: z.enum(['candidate', 'interviewer']).default('candidate'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'candidate' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await registerUser(data);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-gray-400">Display Name</label>
          <input {...register('displayName')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
          {errors.displayName && <p className="text-sm text-red-400">{errors.displayName.message}</p>}
        </div>
        <div>
          <label className="text-sm text-gray-400">Email</label>
          <input {...register('email')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
          {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm text-gray-400">Password</label>
          <input type="password" {...register('password')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2" />
          {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
        </div>
        <div>
          <label className="text-sm text-gray-400">Role</label>
          <select {...register('role')} className="mt-1 w-full rounded bg-gray-800 px-3 py-2">
            <option value="candidate">Candidate</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-primary py-2 font-medium hover:bg-primary-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Have an account? <Link href="/login" className="text-primary">Login</Link>
      </p>
    </div>
  );
}
