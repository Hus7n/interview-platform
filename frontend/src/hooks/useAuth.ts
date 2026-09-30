"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearSession, getToken, getUser, setSession } from "@/lib/api";
import type { Role, User } from "../lib/type";

export function useAuth(required = false, allowed?: Role[]) {
  const [user, setUserState] = useState<User | null>(getUser<User>());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      if (required) router.replace("/login");
      return;
    }
    api<{ data: { user: User } }>("/api/auth/me")
      .then((r) => {
        setUserState(r.data.user);
        if (allowed && !allowed.includes(r.data.user.role))
          router.replace("/dashboard");
      })
      .catch(() => {
        clearSession();
        setUserState(null);
        if (required) router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [required, router, allowed?.join("|")]);
  const login = async (email: string, password: string) => {
    const r = await api<{
      data: { user: User; accessToken: string; refreshToken: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSession(r.data.accessToken, r.data.refreshToken, r.data.user);
    setUserState(r.data.user);
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
    setUserState(r.data.user);
    return r.data.user;
  };
  const logout = async (all = false) => {
    try {
      await api(all ? "/api/auth/logout-all" : "/api/auth/logout", {
        method: all ? "POST" : "POST",
        body: all
          ? undefined
          : JSON.stringify({
              refreshToken: localStorage.getItem("refreshToken"),
            }),
      });
    } catch {}
    clearSession();
    setUserState(null);
    router.replace("/login");
  };
  return { user, loading, login, register, logout };
}
