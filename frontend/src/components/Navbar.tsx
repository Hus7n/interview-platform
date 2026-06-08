'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href={user ? '/dashboard' : '/'} className="text-xl font-bold text-primary">
          InterviewPlatform
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-400">{user.displayName} ({user.role})</span>
              <Link href="/dashboard" className="text-sm hover:text-primary">Dashboard</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm hover:text-primary">Admin</Link>
              )}
              <button onClick={logout} className="rounded bg-gray-800 px-3 py-1 text-sm hover:bg-gray-700">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:text-primary">Login</Link>
              <Link href="/register" className="rounded bg-primary px-3 py-1 text-sm hover:bg-primary-dark">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
