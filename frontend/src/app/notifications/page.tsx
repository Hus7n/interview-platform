"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/lib/type";
import {
  AlertCircle,
  Bell,
  BellOff,
  CalendarPlus,
  CheckCheck,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Trash2,
  Video,
} from "lucide-react";

const ICONS: Record<string, typeof Bell> = {
  interview_invitation: CalendarPlus,
  interview_reminder: Clock,
  interview_cancelled: AlertCircle,
  interview_completed: CheckCircle2,
  feedback: MessageSquare,
  security: ShieldCheck,
  welcome: Mail,
};

export default function Notifications() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    try {
      setError("");
      const r = await api<{
        data: { notifications: Notification[] } | Notification[];
      }>("/api/notifications?limit=50");
      const list = Array.isArray(r?.data)
        ? (r.data as Notification[])
        : (r?.data?.notifications ?? []);
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isUnread = (n: Notification) => !(n.isRead ?? n.is_read ?? false);

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items]);
  const shown = filter === "unread" ? items.filter(isUnread) : items;

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError("");
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <AppShell role={user?.role || "candidate"}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="chip chip-active">Activity Feed</span>
            <span className="metric text-xs">workspace / notifications</span>
          </div>
          <h1 className="page-title mt-2">Notifications</h1>
          <p className="muted mt-1">
            Invitations, reminders, room updates and workspace activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary gap-2 px-3 py-2 text-xs"
            disabled={!unreadCount}
            onClick={() =>
              run(() =>
                api("/api/notifications/read-all", { method: "PATCH" }),
              )
            }
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
          </button>
          <button
            className="btn-danger gap-2 px-3 py-2 text-xs"
            disabled={!items.length}
            onClick={() => {
              if (confirm("Delete every notification? This cannot be undone.")) {
                void run(async () => {
                  await api("/api/notifications/delete-all", {
                    method: "DELETE",
                  });
                  setItems([]);
                });
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear All
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 border border-[#f43f5e]/40 bg-[#f43f5e]/10 p-4 font-mono text-xs text-[#f43f5e]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2">
        {(
          [
            ["all", `All (${items.length})`],
            ["unread", `Unread (${unreadCount})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`border px-3.5 py-2 font-mono text-xs transition-colors ${
              filter === id
                ? "border-[#52a8ff]/40 bg-[#52a8ff]/10 text-[#52a8ff]"
                : "border-white/[0.145] bg-[#0a0a0a] text-[#999999] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card mt-4 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-white/[0.145]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-5">
                <div className="skeleton h-9 w-9 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length ? (
          <div className="divide-y divide-white/[0.145]">
            {shown.map((n, idx) => {
              const unread = isUnread(n);
              const Icon = ICONS[n.type ?? ""] ?? Bell;
              const created = n.createdAt ?? n.created_at;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
                  className={`flex items-start gap-4 p-5 ${unread ? "bg-[#52a8ff]/[0.04]" : ""}`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center border ${
                      unread
                        ? "border-[#52a8ff]/40 bg-[#52a8ff]/10 text-[#52a8ff]"
                        : "border-white/[0.145] bg-black text-[#666666]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-medium tracking-[-0.5px] text-white">
                        {n.title || n.type?.replace(/_/g, " ") || "Workspace update"}
                      </p>
                      {unread && (
                        <span className="chip chip-active font-mono text-[10px]">
                          new
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[#999999]">
                      {n.message}
                    </p>
                    <p className="metric mt-2 flex items-center gap-1.5 text-[11px]">
                      <Clock className="h-3 w-3 text-[#666666]" />
                      {created
                        ? new Date(created).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "just now"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {unread && (
                      <button
                        onClick={() =>
                          run(() =>
                            api(`/api/notifications/${n.id}/read`, {
                              method: "PATCH",
                            }),
                          )
                        }
                        className="btn-secondary gap-1.5 px-3 py-1.5 text-[11px]"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Read
                      </button>
                    )}
                    <button
                      onClick={() =>
                        run(async () => {
                          await api(`/api/notifications/${n.id}`, {
                            method: "DELETE",
                          });
                          setItems((x) => x.filter((y) => y.id !== n.id));
                        })
                      }
                      className="btn-icon h-8 w-8 text-[#f43f5e]"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center border border-white/[0.145] bg-black text-[#666666]">
              {filter === "unread" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <BellOff className="h-6 w-6" />
              )}
            </span>
            <h3 className="mt-4 font-display text-base font-medium tracking-[-1px] text-white">
              {filter === "unread" ? "Nothing unread" : "No notifications yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#999999]">
              {filter === "unread"
                ? "You are all caught up. New room activity will appear here."
                : "Schedule an interview or invite a candidate to start generating activity."}
            </p>
          </div>
        )}
      </div>

      <p className="metric mt-4 flex items-center gap-2 text-[11px]">
        <Video className="h-3.5 w-3.5 text-[#666666]" />
        Notifications are delivered in-app and by email.
      </p>
    </AppShell>
  );
}
