"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import {
  Banner,
  EmptyState,
  IconTile,
  PageHeader,
  SectionCard,
  SkeletonRows,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { userName, type Interview, type User } from "@/lib/type";
import {
  ArrowUpRight,
  Clock,
  Search as SearchIcon,
  UserRound,
  Video,
} from "lucide-react";

type SearchResult = {
  users: User[];
  interviews: Interview[];
};

const EMPTY: SearchResult = { users: [], interviews: [] };

export default function Search() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runSearch = useCallback(async (term: string) => {
    try {
      setError("");
      const r = await api<{ data: SearchResult }>(
        `/api/search?q=${encodeURIComponent(term.trim())}&limit=20`,
      );
      setResult({
        users: r?.data?.users ?? [],
        interviews: r?.data?.interviews ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResult(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch("");
  }, [runSearch]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    void runSearch(query);
  };

  const total = result.users.length + result.interviews.length;

  return (
    <AppShell role={user?.role || "candidate"}>
      <PageHeader
        eyebrow={{ label: "Command Palette" }}
        crumb="workspace / search"
        title="Workspace Search"
        description="Search team members, candidates and interview rooms across your workspace."
      />

      <form onSubmit={submit} className="card mt-7 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by candidate name, email or interview title…"
              aria-label="Search workspace"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-square gap-2">
            <SearchIcon className="h-4 w-4" /> Search
          </button>
        </div>
        <p className="metric mt-3 flex flex-wrap items-center gap-3 text-[11px]">
          <span>min 2 characters</span>
          <span className="h-3 w-px bg-white/[0.145]" />
          <span>{total} result{total === 1 ? "" : "s"}</span>
        </p>
      </form>

      {error && (
        <div className="mt-5">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionCard
          icon={UserRound}
          title={`Users & Candidates (${result.users.length})`}
          description="Accounts that match your query."
          bodyClassName="divide-y divide-white/[0.145]"
        >
          {loading ? (
            <SkeletonRows rows={3} />
          ) : result.users.length ? (
            result.users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                className="row-hover flex items-center gap-4 p-4"
              >
                <span className="avatar-square h-9 w-9 font-mono text-xs">
                  {userName(u).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium tracking-[-0.5px] text-white">
                    {userName(u)}
                  </p>
                  <p className="metric truncate text-xs">{u.email}</p>
                </div>
                <span className="chip font-mono">{u.role}</span>
              </motion.div>
            ))
          ) : (
            <EmptyState
              icon={UserRound}
              title="No users found"
              description="Try a different name or email address."
            />
          )}
        </SectionCard>

        <SectionCard
          icon={Video}
          title={`Interviews (${result.interviews.length})`}
          description="Rooms you have access to."
          bodyClassName="divide-y divide-white/[0.145]"
        >
          {loading ? (
            <SkeletonRows rows={3} />
          ) : result.interviews.length ? (
            result.interviews.map((i, idx) => (
              <motion.div
                key={i.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.2) }}
              >
                <Link
                  href={`/interview/${i.id}`}
                  className="row-hover flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-medium tracking-[-0.5px] text-white">
                      {i.title}
                    </p>
                    <p className="metric mt-1 flex items-center gap-1.5 text-xs">
                      <Clock className="h-3 w-3 text-[#666666]" />
                      {i.scheduledAt
                        ? new Date(i.scheduledAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "unscheduled"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={i.status} />
                    <ArrowUpRight className="h-4 w-4 text-[#666666]" />
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <EmptyState
              icon={Video}
              title="No interviews found"
              description="Try a different title or language."
            />
          )}
        </SectionCard>
      </div>

      {!loading && !total && !error && (
        <p className="metric mt-6 flex items-center justify-center gap-2 text-[11px]">
          <IconTile icon={SearchIcon} tone="muted" size="sm" />
          Type at least two characters to run a search.
        </p>
      )}
    </AppShell>
  );
}
