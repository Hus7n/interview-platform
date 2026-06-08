'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser, setUser, setToken, clearToken, getToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

export function useAuth(requireAuth = false) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = getUser();
    if (stored && token) {
      setUserState(stored);
      api<User>('/api/auth/me')
        .then(setUserState)
        .catch(() => {
          clearToken();
          setUserState(null);
          if (requireAuth) router.push('/login');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (requireAuth) router.push('/login');
    }
  }, [requireAuth, router]);

  const login = async (email: string, password: string) => {
    const res = await api<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
    setUserState(res.user);
    return res.user;
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
    role?: string;
  }) => {
    const res = await api<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(res.token);
    setUser(res.user);
    setUserState(res.user);
    return res.user;
  };

  const logout = () => {
    clearToken();
    setUserState(null);
    router.push('/login');
  };

  return { user, loading, login, register, logout };
}
