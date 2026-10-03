"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import {
  Banner,
  EmptyState,
  IconTile,
  PageHeader,
  SectionCard,
  SkeletonRows,
} from "@/components/ui";
import { api } from "@/lib/api";
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Code2,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";

type Dashboard = Record<string, number | null>;
type Row = Record<string, string | number | null>;

const METRIC_META: Record<
  string,
  { label: string; icon: typeof Users; tone: "accent" | "success" | "invert" | "muted" }
> = {
  total_interviews: { label: "Total Interviews", icon: Video, tone: "accent" },
  completed_interviews: { label: "Completed", icon: CheckCircle2, tone: "success" },
  scheduled_interviews: { label: "Scheduled", icon: CalendarRange, tone: "invert" },
  active_interviews: { label: "Live Now", icon: TrendingUp, tone: "accent" },
  total_users: { label: "Users", icon: Users, tone: "invert" },
  active_users: { label: "Active Users", icon: Users, tone: "success" },
  total_candidates: { label: "Candidates", icon: Users, tone: "muted" },
  total_feedback: { label: "Feedback Rows", icon: MessageSquare, tone: "muted" },
  avg_technical: { label: "Avg Technical", icon: Code2, tone: "accent" },
  avg_communication: { label: "Avg Communication", icon: MessageSquare, tone: "accent" },
  avg_problem_solving: { label: "Avg Problem Solving", icon: Star, tone: "accent" },
  avg_overall: { label: "Avg Overall", icon: Star, tone: "success" },
  total: { label: "Scorecards", icon: MessageSquare, tone: "muted" },
  hired: { label: "Hire", icon: CheckCircle2, tone: "success" },
  not_hired: { label: "No Hire", icon: BarChart3, tone: "muted" },
  hire_rate: { label: "Hire Rate %", icon: TrendingUp, tone: "success" },
};

const humanise = (k: string) =>
  METRIC_META[k]?.label ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Analytics() {
  return (
    <Protected roles={["admin"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const [stats, setStats] = useState<Dashboard>({});
  const [languages, setLanguages] = useState<Row[]>([]);
  const [months, setMonths] = useState<Row[]>([]);
  const [interviewers, setInterviewers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [a, b, c, d] = await Promise.all([
        api<{ data: Dashboard }>("/api/analytics/dashboard"),
        api<{ data: Row[] }>("/api/analytics/by-language"),
        api<{ data: Row[] }>("/api/analytics/by-month"),
        api<{ data: Row[] }>("/api/analytics/top-interviewers"),
      ]);
      setStats(a?.data ?? {});
      setLanguages(b?.data ?? []);
      setMonths(c?.data ?? []);
      setInterviewers(d?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = Object.entries(stats);

  return (
    <AppShell role="admin">
      <PageHeader
        eyebrow={{ label: "Platform Metrics" }}
        crumb="workspace / admin / analytics"
        title="Analytics"
        description="Interview volume, language mix, scorecard quality and hiring outcomes."
      />

      {error && (
        <div className="mt-6">
          <Banner>{error}</Banner>
        </div>
      )}

      {loading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card space-y-3 p-5">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-7 w-16" />
              <div className="skeleton h-2.5 w-20" />
            </div>
          ))}
        </div>
      ) : entries.length ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {entries.map(([key, value], i) => {
            const meta = METRIC_META[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                className="card card-hover p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="metric text-[11px] uppercase tracking-[0.12em]">
                    {humanise(key)}
                  </span>
                  {meta && <IconTile icon={meta.icon} tone={meta.tone} size="sm" />}
                </div>
                <p className="mt-3 font-display text-3xl font-medium leading-none tracking-[-1px] text-white">
                  {value === null || value === undefined ? "—" : String(value)}
                </p>
                <p className="metric mt-2.5 font-mono text-[10px]">{key}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="mt-7">
          <SectionCard icon={BarChart3} title="No analytics yet">
            <EmptyState
              icon={BarChart3}
              title="Metrics unavailable"
              description="Analytics appear once interviews and scorecards exist."
            />
          </SectionCard>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <BarList
          icon={Code2}
          title="By Language"
          loading={loading}
          rows={languages}
          primary={(r) => String(r.language ?? "—")}
          value={(r) => Number(r.count ?? 0)}
          valueLabel={(r) => `${r.count ?? 0} rooms`}
          empty="No interviews recorded."
        />
        <BarList
          icon={CalendarRange}
          title="By Month"
          loading={loading}
          rows={months}
          primary={(r) => String(r.month ?? "—")}
          value={(r) => Number(r.total ?? 0)}
          valueLabel={(r) => `${r.total ?? 0} total · ${r.completed ?? 0} done`}
          empty="No interviews in the last 6 months."
        />
        <BarList
          icon={Users}
          title="Top Interviewers"
          loading={loading}
          rows={interviewers}
          primary={(r) => String(r.display_name ?? r.id ?? "—")}
          value={(r) => Number(r.interviews_conducted ?? 0)}
          valueLabel={(r) => `${r.interviews_conducted ?? 0} conducted · avg ${r.avg_rating ?? "—"}`}
          empty="No completed interviews yet."
        />
      </div>
    </AppShell>
  );
}

function BarList({
  icon,
  title,
  rows,
  loading,
  primary,
  value,
  valueLabel,
  empty,
}: {
  icon: typeof Users;
  title: string;
  rows: Row[];
  loading: boolean;
  primary: (r: Row) => string;
  value: (r: Row) => number;
  valueLabel: (r: Row) => string;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map(value));

  return (
    <SectionCard icon={icon} title={title} bodyClassName="divide-y divide-white/[0.145]">
      {loading ? (
        <SkeletonRows rows={3} />
      ) : rows.length ? (
        rows.map((r, i) => {
          const pct = Math.round((value(r) / max) * 100);
          return (
            <div key={`${primary(r)}-${i}`} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-display text-sm font-medium tracking-[-0.5px] text-white">
                  {primary(r)}
                </span>
                <span className="metric shrink-0 font-mono text-xs">
                  {valueLabel(r)}
                </span>
              </div>
              <div className="mt-2.5 h-1 w-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-[#52a8ff]"
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center">
          <p className="metric text-xs">{empty}</p>
        </div>
      )}
    </SectionCard>
  );
}
