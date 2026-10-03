"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Code2,
  ShieldAlert,
  Search,
} from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user) {
      api<{ data: { unreadCount: number } }>("/api/notifications/unread-count")
        .then((r) => setUnread(r.data.unreadCount))
        .catch(() => {});
    }
  }, [user]);

  /* Close the account menu on navigation. */
  useEffect(() => setOpen(false), [pathname]);

  /* Close the account menu when clicking outside of it. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /* Honour the advertised ⌘K / Ctrl+K shortcut. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.145] bg-black/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile brand */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-none bg-white text-[#121212]">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-medium tracking-[-1px] text-white">
            InterviewOS
          </span>
        </div>

        {/* Workspace title + search */}
        <div className="hidden items-center gap-4 text-sm lg:flex">
          <span className="font-mono text-xs uppercase tracking-wider text-[#666666]">
            workspace / <span className="text-[#999999]">technical interviews</span>
          </span>
          <span className="h-4 w-px bg-white/[0.145]" />
          <Link
            href="/search"
            className="flex items-center gap-2 border border-white/[0.145] bg-[#0a0a0a] px-3 py-1.5 text-xs text-[#666666] transition-colors hover:border-[#52a8ff]/50 hover:text-[#52a8ff]"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search workspace...</span>
            <kbd className="border border-white/[0.145] bg-[#1f1f1f] px-1.5 py-0.5 font-mono text-[10px] text-[#999999]">
              ⌘K
            </kbd>
          </Link>
        </div>

        {/* Right section */}
        <div className="relative flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative grid h-9 w-9 place-items-center border border-white/[0.145] bg-[#0a0a0a] text-[#999999] transition-colors hover:border-[#52a8ff]/50 hover:text-white"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#52a8ff] px-1 font-mono text-[10px] font-semibold text-black">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2.5 border border-white/[0.145] bg-[#0a0a0a] px-2.5 py-1.5 transition-colors hover:border-white/25"
            >
              <span className="grid h-7 w-7 place-items-center bg-white text-xs font-semibold text-[#121212]">
                {(user?.displayName || "U").slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden text-left sm:block">
                <span className="block text-xs font-medium text-white">
                  {user?.displayName || "User"}
                </span>
                <span className="block font-mono text-[10px] capitalize text-[#666666]">
                  {user?.role || "candidate"}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-[#666666] transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-50 w-52 border border-white/[0.145] bg-[#0a0a0a]"
                >
                  <div className="border-b border-white/[0.145] px-3 py-2.5">
                    <p className="text-xs font-medium text-white">
                      {user?.displayName}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[#666666]">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#999999] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <UserIcon className="h-4 w-4" />
                      Account Profile
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#999999] transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Admin Console
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-[#f43f5e] transition-colors hover:bg-[#f43f5e]/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
