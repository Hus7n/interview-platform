"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  clearSession,
  getToken,
  getUser,
  setSession,
  setUser as persistUser,
} from "@/lib/api";
import type { Role, User } from "../lib/type";

/**
 * A single module-level cache + subscriber set so every `useAuth()` consumer
 * (Header, Sidebar shell, Protected gate, page bodies) shares one
 * `/api/auth/me` round-trip instead of firing its own on every mount.
 */
let cachedUser: User | null = null;
let inflight: Promise<User | null> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readCache(): User | null {
  if (cachedUser) return cachedUser;
  cachedUser = getUser<User>();
  return cachedUser;
}

function loadUser(): Promise<User | null> {
  if (inflight) return inflight;

  inflight = api<{ data: { user: User } }>("/api/auth/me")
    .then((r) => {
      const user = r?.data?.user ?? null;
      cachedUser = user;
      if (user) persistUser(user);
      emit();
      return user;
    })
    .catch(() => {
      cachedUser = null;
      clearSession();
      emit();
      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useAuth(required = false, allowed?: Role[]) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const roleKey = allowed?.join("|") ?? "";
  const roles = roleKey ? (roleKey.split("|") as Role[]) : undefined;

  useEffect(() => {
    setUserState(readCache());
    const onChange = () => setUserState(cachedUser);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  useEffect(() => {
    if (!getToken()) {
      cachedUser = null;
      emit();
      setLoading(false);
      if (required) router.replace("/login");
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadUser()
      .then((u) => {
        if (cancelled) return;
        if (required && !u) {
          router.replace("/login");
          return;
        }
        if (u && roles && !roles.includes(u.role)) router.replace("/dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required, router, roleKey]);

  const login = async (email: string, password: string) => {
    const r = await api<{
      data: { user: User; accessToken: string; refreshToken: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setSession(r.data.accessToken, r.data.refreshToken, r.data.user);
    cachedUser = r.data.user;
    emit();
    return r.data.user;
  };

  const register = async (data: {
    email: string;
    password: string;
    displayName: string;
    role?: Role;
  }) => {
    const r = await api<{ data: { user: User } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    cachedUser = r.data.user;
    emit();
    return r.data.user;
  };

  const refresh = () => loadUser();

  const logout = async (all = false) => {
    try {
      await api(all ? "/api/auth/logout-all" : "/api/auth/logout", {
        method: "POST",
        body: all
          ? undefined
          : JSON.stringify({
              refreshToken: typeof window !== "undefined"
                ? localStorage.getItem("refreshToken")
                : null,
            }),
      });
    } catch {
      /* session is cleared locally regardless */
    }
    clearSession();
    cachedUser = null;
    emit();
    router.replace("/login");
  };

  return { user, loading, login, register, logout, refresh };
}

export default useAuth;
