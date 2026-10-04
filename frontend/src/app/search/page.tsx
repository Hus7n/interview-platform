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
import { formatDateTime } from "@/lib/time";
import {
  userName,
  type Interview,
  type InviteResult,
  type User,
} from "@/lib/type";
import {
  ArrowUpRight,
  Check,
  Clock,
  Loader2,
  MailWarning,
  Search as SearchIcon,
  UserRound,
  UserPlus,
  Video,
  X,
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

  /* ── Invite flow ── */
  const [target, setTarget] = useState<User | null>(null);
  const [scheduled, setScheduled] = useState<Interview[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, InviteResult>>({});
  const [inviteError, setInviteError] = useState("");

  const canInvite = user?.role === "admin" || user?.role === "interviewer";

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

  const openPicker = async (u: User) => {
    setTarget(u);
    setInviteError("");
    setSent({});
    setLoadingRooms(true);
    try {
      const r = await api<{ data: { interviews: Interview[] } }>(
        "/api/interviews?status=scheduled&page=1&limit=50",
      );
      setScheduled(r?.data?.interviews ?? []);
    } catch (e) {
      setInviteError(
        e instanceof Error ? e.message : "Could not load your scheduled sessions",
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  const inviteTo = async (room: Interview) => {
    if (!target) return;
    try {
      setPendingRoom(room.id);
      setInviteError("");
      const r = await api<{ data: { invite: InviteResult | null } }>(
        `/api/interviews/${room.id}/participants`,
        {
          method: "POST",
          body: JSON.stringify({ user_id: target.id, role: "candidate" }),
        },
      );
      if (r?.data?.invite) {
        setSent((prev) => ({ ...prev, [room.id]: r.data.invite! }));
      }
    } catch (e) {
      setInviteError(
        e instanceof Error ? e.message : `Could not invite to "${room.title}"`,
      );
    } finally {
      setPendingRoom(null);
    }
  };

  const total = result.users.length + result.interviews.length;

  return (
    <AppShell role={user?.role || "candidate"}>
      <PageHeader
        eyebrow={{ label: "Command Palette" }}
        crumb="workspace / search"
        title="Workspace Search"
        description={
          canInvite
            ? "Find a team member or candidate, then send them straight into one of your scheduled sessions."
            : "Search team members, candidates and interview rooms across your workspace."
        }
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

      {/* ── Interview picker ── */}
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mt-6 border-[#52a8ff]/40 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <IconTile icon={UserPlus} tone="accent" size="sm" />
              <div className="min-w-0">
                <h3 className="section-title">
                  Invite {userName(target)} to a session
                </h3>
                <p className="metric mt-0.5 truncate font-mono text-[11px]">
                  {target.email} · will be added as a candidate
                </p>
              </div>
            </div>
            <button
              onClick={() => setTarget(null)}
              className="btn-icon shrink-0"
              aria-label="Close picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {inviteError && (
            <div className="mt-4">
              <Banner tone="error">{inviteError}</Banner>
            </div>
          )}

          {loadingRooms ? (
            <div className="mt-4">
              <SkeletonRows rows={2} />
            </div>
          ) : scheduled.length ? (
            <div className="mt-4 divide-y divide-white/[0.145] border border-white/[0.145]">
              {scheduled.map((room) => {
                const done = sent[room.id];
                return (
                  <div
                    key={room.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-medium text-white">
                        {room.title}
                      </p>
                      <p className="metric mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <Clock className="h-3 w-3 text-[#666666]" />
                        {formatDateTime(room.scheduledAt)}
                        <StatusBadge status={room.status} />
                      </p>
                      {done && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-2">
                          {done.notifiedInApp && (
                            <span className="chip chip-success font-mono">
                              <Check className="h-3 w-3" /> in-app notice sent
                            </span>
                          )}
                          {done.emailDelivered ? (
                            <span className="chip chip-success font-mono">
                              emailed
                            </span>
                          ) : (
                            <span
                              className="chip chip-warn font-mono"
                              title={done.emailReason}
                            >
                              <MailWarning className="h-3 w-3" />
                              {done.emailReason === "smtp_not_configured"
                                ? "email not sent — SMTP not configured"
                                : "email not sent"}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    {done ? (
                      <Link
                        href={`/schedule/${room.id}`}
                        className="btn-secondary shrink-0 gap-1.5 px-3 py-2 text-xs"
                      >
                        Manage <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => void inviteTo(room)}
                        disabled={pendingRoom === room.id}
                        className="btn-square shrink-0 gap-1.5 px-3 py-2 text-xs"
                      >
                        {pendingRoom === room.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                            Inviting
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" /> Invite here
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="metric mt-4 text-xs">
              You have no scheduled sessions to invite them to yet. Create one from{" "}
              <Link href="/schedule" className="text-[#52a8ff] hover:underline">
                the scheduler
              </Link>
              .
            </p>
          )}
        </motion.div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionCard
          icon={UserRound}
          title={`Users & Candidates (${result.users.length})`}
          description={
            canInvite
              ? "Select Invite to add someone to a scheduled session — they are notified in-app and emailed."
              : "Accounts that match your query."
          }
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
                <span className="avatar-square h-9 w-9 shrink-0 font-mono text-xs">
                  {userName(u).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium tracking-[-0.5px] text-white">
                    {userName(u)}
                  </p>
                  <p className="metric truncate text-xs">{u.email}</p>
                </div>
                <span className="chip font-mono">{u.role}</span>
                {canInvite && (
                  <button
                    onClick={() => void openPicker(u)}
                    className="btn-square shrink-0 gap-1.5 px-3 py-2 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Invite
                  </button>
                )}
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
                      {i.scheduledAt ? formatDateTime(i.scheduledAt) : "unscheduled"}
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
