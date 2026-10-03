"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Interview, InterviewStatus } from "@/lib/type";
import { useAuth } from "@/hooks/useAuth";
import {
  Video,
  Search,
  Filter,
  Plus,
  Calendar,
  Trash2,
  Edit,
  XCircle,
  ArrowUpRight,
} from "lucide-react";

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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="page-title">Technical Interviews</h1>
          <p className="muted mt-1">
            Manage scheduled sessions, join live rooms, and review scorecards.
          </p>
        </div>
        <Link href="/schedule" className="btn-square gap-2">
          <Plus className="h-4 w-4" />
          New Interview
        </Link>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="card mt-7 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              placeholder="Search by title, interviewer, or language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>

          <div className="relative md:w-56">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <select
              className="input pl-10 appearance-none bg-[#0a0a0a] cursor-pointer font-mono"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
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
          </div>

          <button className="btn-secondary gap-2" onClick={load}>
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </div>

      {/* List Feed */}
      <div className="card mt-6 overflow-hidden">
        <div className="hidden grid-cols-[1fr_180px_130px_160px] gap-4 border-b border-white/[0.145] bg-black px-6 py-3.5 font-mono text-xs uppercase tracking-wider text-[#999999] md:grid">
          <span>Interview Session</span>
          <span>Scheduled Time</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/[0.145]">
          {loading ? (
            <div className="p-12 text-center font-mono text-xs text-[#999999]">
              Loading interviews...
            </div>
          ) : items.length ? (
            items.map((i, idx) => (
              <motion.div
                key={i.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="grid gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1fr_180px_130px_160px] md:items-center"
              >
                <div>
                  <h3 className="font-display text-base font-medium text-white">
                    {i.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[#999999]">
                    <span className="chip chip-active text-[10px]">
                      {i.language}
                    </span>
                    <span>•</span>
                    <span>{i.durationMinutes} mins</span>
                    <span>•</span>
                    <span>{i.participantCount} participants</span>
                  </div>
                </div>

                <div className="font-mono text-xs text-[#999999] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#666666]" />
                  {new Date(i.scheduledAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>

                <div>
                  <StatusBadge status={i.status} />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Link
                    className="btn-square text-xs py-1.5 px-3 gap-1"
                    href={`/interview/${i.id}`}
                  >
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  {(user?.role === "admin" || i.createdBy === user?.id) &&
                    i.status !== "completed" &&
                    i.status !== "cancelled" && (
                      <div className="flex items-center gap-1">
                        <Link
                          className="p-1.5 text-[#999999] hover:text-white transition-colors border border-transparent hover:border-white/[0.145]"
                          href={`/schedule/${i.id}`}
                          title="Edit Interview"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="p-1.5 text-[#999999] hover:text-[#52a8ff] transition-colors border border-transparent hover:border-white/[0.145]"
                          title="Cancel Interview"
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
                          <XCircle className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-[#f43f5e] hover:text-[#f43f5e]/80 transition-colors border border-transparent hover:border-white/[0.145]"
                          title="Delete Interview"
                          onClick={async () => {
                            if (
                              confirm(
                                "Delete this interview? This cannot be undone."
                              )
                            ) {
                              await api(`/api/interviews/${i.id}`, {
                                method: "DELETE",
                              });
                              load();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Video className="mx-auto h-8 w-8 text-[#666666]" />
              <p className="mt-2 font-mono text-xs text-[#999999]">
                No interviews match your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
