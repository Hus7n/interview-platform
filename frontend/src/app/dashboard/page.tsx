"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Interview, User } from "@/lib/type";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  Code2,
} from "lucide-react";

export default function Dashboard() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}

function DashboardInner() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Interview[]>([]);
  const [e, setE] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ data: { user: User } }>("/api/auth/me"),
      api<{ data: { interviews: Interview[] } }>(
        "/api/interviews?limit=6&page=1"
      ),
    ])
      .then(([u, i]) => {
        setUser(u.data.user);
        setItems(i.data.interviews);
      })
      .catch((x) =>
        setE(x instanceof Error ? x.message : "Unable to load dashboard")
      )
      .finally(() => setLoading(false));
  }, []);

  const scheduledCount = items.filter((x) => x.status === "scheduled").length;
  const inProgressCount = items.filter((x) => x.status === "in_progress").length;
  const completedCount = items.filter((x) => x.status === "completed").length;

  return (
    <AppShell role={user?.role || "candidate"}>
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="chip chip-active">
              Workspace Dashboard
            </span>
            <span className="font-mono text-xs text-[#999999]">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="page-title mt-2">
            Good to see you, {user?.displayName?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="muted mt-1">
            Here is what is happening with your technical interviews today.
          </p>
        </div>
        <Link href="/schedule" className="btn-square gap-2">
          <Plus className="h-4 w-4" />
          Schedule Interview
        </Link>
      </div>

      {e && (
        <div className="mt-5 flex items-center gap-2 border border-[#f43f5e]/40 bg-[#f43f5e]/10 p-4 font-mono text-xs text-[#f43f5e]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {e}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Upcoming",
            count: scheduledCount,
            icon: Clock,
            color: "text-[#52a8ff]",
            badge: "+12% this week",
          },
          {
            title: "In Progress",
            count: inProgressCount,
            icon: PlayCircle,
            color: "text-[#52a8ff]",
            badge: "Active now",
          },
          {
            title: "Completed",
            count: completedCount,
            icon: CheckCircle2,
            color: "text-[#62c073]",
            badge: "Scorecard ready",
          },
          {
            title: "Total Tracked",
            count: items.length,
            icon: Video,
            color: "text-white",
            badge: "All time",
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#999999]">
                  {stat.title}
                </span>
                <div className={`grid h-8 w-8 place-items-center border border-white/[0.145] bg-black ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-3xl font-medium tracking-[-1px] text-white">
                {stat.count}
              </p>
              <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[#666666]">
                <span className="flex items-center gap-1 text-[#999999]">
                  <TrendingUp className="h-3 w-3 text-[#62c073]" />
                  {stat.badge}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Interviews Feed Section */}
      <section className="mt-8 card">
        <div className="flex items-center justify-between border-b border-white/[0.145] p-5 bg-black">
          <div>
            <h2 className="font-display text-lg font-medium tracking-[-1px] text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-[#52a8ff]" />
              Recent Technical Interviews
            </h2>
            <p className="muted mt-0.5 text-xs">
              Your latest interview sessions and video rooms.
            </p>
          </div>
          <Link
            href="/interviews"
            className="flex items-center gap-1 font-mono text-xs text-[#52a8ff] hover:underline"
          >
            View all interviews
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.145]">
          {loading ? (
            <div className="p-10 text-center font-mono text-xs text-[#999999]">
              Loading workspace data...
            </div>
          ) : items.length ? (
            items.map((i) => (
              <motion.div
                key={i.id}
                whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.02)" }}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/[0.145] bg-black text-[#52a8ff]">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-medium text-white">
                      {i.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[#999999]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#666666]" />
                        {new Date(i.scheduledAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#666666]" />
                        {i.durationMinutes} mins
                      </span>
                      <span>•</span>
                      <span className="chip chip-active font-mono text-[10px]">
                        {i.language}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <StatusBadge status={i.status} />
                  <Link
                    href={`/interview/${i.id}`}
                    className="btn-secondary text-xs py-1.5 px-4 gap-1.5"
                  >
                    Enter Room
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center border border-white/[0.145] bg-black text-[#666666]">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-display text-sm font-medium text-white">
                No interviews scheduled
              </h3>
              <p className="mt-1 text-xs text-[#999999]">
                Get started by scheduling a new technical interview session.
              </p>
              <Link href="/schedule" className="btn-square mt-4 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Schedule Now
              </Link>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
