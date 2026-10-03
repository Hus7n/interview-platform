"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import InterviewForm from "@/components/InterviewForm";
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
import {
  userName,
  type Interview,
  type Participant,
  type User,
} from "@/lib/type";
import { Search, Trash2, UserPlus, Users } from "lucide-react";

export default function Edit() {
  return (
    <Protected roles={["admin", "interviewer"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [inviteRole, setInviteRole] = useState<"candidate" | "interviewer">(
    "candidate",
  );
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadParticipants = useCallback(async () => {
    try {
      const r = await api<{ data: { participants: Participant[] } }>(
        `/api/interviews/${id}/participants`,
      );
      setParticipants(r?.data?.participants ?? []);
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "Unable to load participants",
      });
    }
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api<{ data: { interview: Interview } }>(
          `/api/interviews/${id}`,
        );
        if (alive) setInterview(r.data.interview);
      } catch (e) {
        if (alive) {
          setMessage({
            tone: "error",
            text: e instanceof Error ? e.message : "Interview not found",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    void loadParticipants();
    return () => {
      alive = false;
    };
  }, [id, loadParticipants]);

  const searchUsers = async () => {
    if (query.trim().length < 2) {
      setUsers([]);
      setMessage(null);
      return;
    }
    try {
      setMessage(null);
      const r = await api<{ data: { users: User[] } }>(
        `/api/search?q=${encodeURIComponent(query.trim())}&limit=20`,
      );
      setUsers(r?.data?.users ?? []);
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "User search failed",
      });
    }
  };

  const add = async (u: User) => {
    try {
      setBusy(true);
      setMessage(null);
      await api(`/api/interviews/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({ user_id: u.id, role: inviteRole }),
      });
      setMessage({
        tone: "success",
        text: `${userName(u)} added as ${inviteRole}.`,
      });
      setUsers([]);
      setQuery("");
      await loadParticipants();
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "Could not add participant",
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Participant) => {
    const label = p.display_name || p.email || p.user_id;
    if (!confirm(`Remove ${label} from this interview?`)) return;
    try {
      setMessage(null);
      await api(`/api/interviews/${id}/participants`, {
        method: "DELETE",
        body: JSON.stringify({ user_id: p.user_id }),
      });
      await loadParticipants();
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "Could not remove participant",
      });
    }
  };

  const canManage =
    !!me &&
    !!interview &&
    (me.role === "admin" ||
      interview.createdBy === me.id ||
      interview.created_by === me.id);

  if (loading) {
    return (
      <AppShell role={me?.role ?? "interviewer"}>
        <PageHeader
          crumb="workspace / schedule"
          title="Edit Interview"
          description="Loading session configuration…"
        />
        <div className="card mt-7">
          <SkeletonRows rows={4} />
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell role={me?.role ?? "interviewer"}>
        <PageHeader
          crumb="workspace / schedule"
          title="Edit Interview"
          description="This session could not be loaded."
        />
        <div className="card mt-7">
          <EmptyState
            icon={Users}
            title="Interview unavailable"
            description="It may have been deleted, or you may not be a participant."
            action={
              <button
                onClick={() => router.push("/interviews")}
                className="btn-square gap-2"
              >
                Back to interviews
              </button>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={me?.role ?? "interviewer"}>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow={{ label: "Scheduler" }}
          crumb="workspace / schedule / edit"
          title="Edit Interview"
          description={interview.title}
          actions={<StatusBadge status={interview.status} />}
        />

        {message && (
          <div className="mt-6">
            <Banner tone={message.tone}>{message.text}</Banner>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card mt-7 p-6 sm:p-8"
        >
          <InterviewForm
            initial={interview}
            onSaved={() => router.push(`/interview/${id}`)}
          />

          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/[0.145] pt-5">
            <button
              className="btn-secondary gap-2 text-[#f5b544]"
              onClick={async () => {
                if (!confirm("Cancel this interview?")) return;
                try {
                  await api(`/api/interviews/${id}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "cancelled" }),
                  });
                  router.push(`/interview/${id}`);
                } catch (e) {
                  setMessage({
                    tone: "error",
                    text: e instanceof Error ? e.message : "Could not cancel",
                  });
                }
              }}
            >
              Cancel interview
            </button>
            <button
              className="btn-danger gap-2"
              onClick={async () => {
                if (!confirm("Delete this interview permanently?")) return;
                try {
                  await api(`/api/interviews/${id}`, { method: "DELETE" });
                  router.push("/interviews");
                } catch (e) {
                  setMessage({
                    tone: "error",
                    text: e instanceof Error ? e.message : "Could not delete",
                  });
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete interview
            </button>
          </div>
        </motion.div>

        {canManage && (
          <SectionCard
            icon={Users}
            title={`Participants (${participants.length})`}
            description="Invite candidates or co-interviewers. Invites are emailed automatically."
            className="mt-6"
            bodyClassName="p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
                <input
                  className="input pl-10 font-mono"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  placeholder="Search by name or email…"
                />
              </div>
              <select
                className="select sm:w-44 font-mono text-xs"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "candidate" | "interviewer")
                }
              >
                <option value="candidate">Candidate</option>
                <option value="interviewer">Interviewer</option>
              </select>
              <button onClick={searchUsers} className="btn-square gap-2">
                <Search className="h-4 w-4" /> Search
              </button>
            </div>

            {users.length > 0 && (
              <div className="mt-4 divide-y divide-white/[0.145] border border-white/[0.145]">
                {users
                  .filter((u) => !participants.some((p) => p.user_id === u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="row-hover flex items-center justify-between gap-4 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="avatar-square h-8 w-8 font-mono text-[11px]">
                          {userName(u).slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-medium text-white">
                            {userName(u)}
                          </p>
                          <p className="metric truncate text-xs">
                            {u.email} · {u.role}
                          </p>
                        </div>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => add(u)}
                        className="btn-square gap-1.5 px-3 py-2 text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="mt-6">
              <p className="label">Current participants</p>
              <div className="mt-2 divide-y divide-white/[0.145] border border-white/[0.145]">
                {participants.map((p) => (
                  <div
                    key={p.user_id}
                    className="row-hover flex items-center justify-between gap-4 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconTile
                        icon={UserPlus}
                        tone={p.role === "candidate" ? "accent" : "invert"}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-medium text-white">
                          {p.display_name || p.email || p.user_id}
                        </p>
                        <p className="metric truncate font-mono text-[11px]">
                          {p.role} · {String(p.user_id).slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(p)}
                      className="btn-icon h-8 w-8 text-[#f43f5e]"
                      title="Remove participant"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {!participants.length && (
                  <p className="metric p-4 text-xs">No participants yet.</p>
                )}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
