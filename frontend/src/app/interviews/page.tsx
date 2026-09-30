"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Interview, InterviewStatus, User } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
export default function Interviews() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const { user } = useAuth(true);
  const [items, setItems] = useState<Interview[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page: "1", limit: "50" });
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    api<{ data: { interviews: Interview[] } }>("/api/interviews?" + q)
      .then((r) => setItems(r.data.interviews))
      .finally(() => setLoading(false));
  };
  useEffect(load, [status]);
  return (
    <AppShell role={user?.role || "candidate"}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="muted mt-1">
            Schedule, manage and enter interview rooms.
          </p>
        </div>
        <Link href="/schedule" className="btn-primary">
          ＋ New interview
        </Link>
      </div>
      <div className="card mt-7 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="input mt-0"
            placeholder="Search interviews…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <select
            className="input mt-0 md:max-w-48"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {(
              [
                "scheduled",
                "in_progress",
                "completed",
                "cancelled",
              ] as InterviewStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={load}>
            Search
          </button>
        </div>
      </div>
      <div className="card mt-5 overflow-hidden">
        <div className="hidden grid-cols-[1fr_160px_110px_120px] gap-4 border-b border-line bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span>Interview</span>
          <span>Scheduled</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Loading…</div>
        ) : items.length ? (
          items.map((i) => (
            <div
              key={i.id}
              className="grid gap-3 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[1fr_160px_110px_120px] md:items-center"
            >
              <div>
                <p className="font-semibold">{i.title}</p>
                <p className="text-xs text-muted">
                  {i.language} · {i.durationMinutes} min · {i.participantCount}{" "}
                  participants
                </p>
              </div>
              <p className="text-sm">
                {new Date(i.scheduledAt).toLocaleString()}
              </p>
              <StatusBadge status={i.status} />
              <div className="flex flex-wrap gap-2">
                <Link
                  className="text-sm font-semibold text-brand"
                  href={`/interview/${i.id}`}
                >
                  Open
                </Link>
                {(user?.role === "admin" || i.createdBy === user?.id) &&
                  i.status !== "completed" &&
                  i.status !== "cancelled" && (
                    <>
                      <Link
                        className="text-sm text-muted"
                        href={`/schedule/${i.id}`}
                      >
                        Edit
                      </Link>
                      <button
                        className="text-sm text-amber-600"
                        onClick={async () => {
                          if (confirm("Cancel this interview?")) {
                            await api(`/api/interviews/${i.id}/status`, {
                              method: "PATCH",
                              body: JSON.stringify({ status: "cancelled" }),
                            });
                            load();
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="text-sm text-red-600"
                        onClick={async () => {
                          if (
                            confirm(
                              "Delete this interview? This cannot be undone.",
                            )
                          ) {
                            await api(`/api/interviews/${i.id}`, {
                              method: "DELETE",
                            });
                            load();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-sm text-muted">
            No interviews found.
          </div>
        )}
      </div>
    </AppShell>
  );
}
