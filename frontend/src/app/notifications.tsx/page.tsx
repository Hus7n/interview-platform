"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Notification, User } from "@/lib/types";
export default function Notifications() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const [n, setN] = useState<Notification[]>([]);
  const [u, setU] = useState<User>();
  const load = () =>
    api<{ data: { notifications: Notification[] } } | { data: Notification[] }>(
      `/api/notifications?limit=50`,
    ).then((r: any) => setN(r.data.notifications || r.data || []));
  useEffect(() => {
    api<{ data: { user: User } }>("/api/auth/me").then((r) =>
      setU(r.data.user),
    );
    load();
  }, []);
  const read = async (id: string) => {
    await api(`/api/notifications/${id}/read`, { method: "PATCH" });
    load();
  };
  const remove = async (id: string) => {
    await api(`/api/notifications/${id}`, { method: "DELETE" });
    setN((x) => x.filter((n) => n.id !== id));
  };
  return (
    <AppShell role={u?.role || "candidate"}>
      <div className="flex justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="muted mt-1">
            Invitations, reminders and account activity.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() =>
              api("/api/notifications/read-all", { method: "PATCH" }).then(load)
            }
          >
            Mark all read
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              api("/api/notifications/delete-all", { method: "DELETE" }).then(
                () => setN([]),
              )
            }
          >
            Clear all
          </button>
        </div>
      </div>
      <div className="card mt-7 divide-y divide-line">
        {n.length ? (
          n.map((x) => {
            const unread = !(x.isRead ?? x.is_read ?? false);
            return (
              <div
                key={x.id}
                className={`flex items-start gap-3 p-5 ${unread ? "bg-indigo-50/40" : ""}`}
              >
                <button
                  onClick={() => unread && read(x.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-brand" : "bg-slate-300"}`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {x.title || x.type || "Notification"}
                      </p>
                      <p className="mt-1 text-sm text-muted">{x.message}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(
                          x.createdAt ?? x.created_at ?? Date.now(),
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => remove(x.id)}
                  className="text-xs text-slate-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-sm text-muted">
            You are all caught up.
          </div>
        )}
      </div>
    </AppShell>
  );
}
