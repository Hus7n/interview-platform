"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (user)
      api<{ data: { unreadCount: number } }>("/api/notifications/unread-count")
        .then((r) => setUnread(r.data.unreadCount))
        .catch(() => {});
  }, [user]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-bold text-white">
            I
          </div>
          <span className="font-bold">InterviewOS</span>
        </div>
        <div className="hidden text-sm text-muted lg:block">
          Interview workspace
        </div>
        <div className="relative flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            ◉
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-brand">
              {(user?.displayName || "U").slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold">
                {user?.displayName}
              </span>
              <span className="block text-xs text-muted">{user?.role}</span>
            </span>
            <span>⌄</span>
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-line bg-white p-2 shadow-lg">
              <Link
                href="/profile"
                className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
              >
                Profile
              </Link>
              <button
                onClick={() => logout()}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
