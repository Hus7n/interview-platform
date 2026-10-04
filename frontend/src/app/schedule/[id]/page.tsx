"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import InterviewForm from "@/components/InterviewForm";
import StatusBadge from "@/components/StatusBadge";
import UserSearch from "@/components/UserSearch";
import InviteStatusList from "@/components/InviteStatusList";
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
import { countdownParts, formatCountdown, formatDateTime } from "@/lib/time";
import {
  userName,
  type Interview,
  type InviteResult,
  type Participant,
  type User,
} from "@/lib/type";
import {
  ArrowUpRight,
  CalendarClock,
  Link2,
  Play,
  Trash2,
  Users,
} from "lucide-react";

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
  const [inviteRole, setInviteRole] = useState<"candidate" | "interviewer">(
    "candidate",
  );
  const [invites, setInvites] = useState<InviteResult[]>([]);
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  /* Resolved after mount so the server and client markup match. */
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

  /* Countdown ticker so "starts in …" stays accurate without a reload. */
  useEffect(() => {
    if (!interview || interview.status !== "scheduled") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [interview]);

  const add = async (u: User) => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await api<{
        data: { invite: InviteResult | null; mailConfigured: boolean };
      }>(`/api/interviews/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({ user_id: u.id, role: inviteRole }),
      });
      const invite = r?.data?.invite ?? null;
      setInvites((prev) => (invite ? [...prev, invite] : prev));
      setMessage({
        tone: invite?.emailDelivered ? "success" : "info",
        text: invite?.emailDelivered
          ? `${userName(u)} added as ${inviteRole} — invitation emailed.`
          : `${userName(u)} added as ${inviteRole} — notified in-app, but email was not sent${
              invite?.emailReason === "smtp_not_configured"
                ? " because SMTP is not configured on the server"
                : ""
            }. Share the room link below to reach them.`,
      });
      await loadParticipants();
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "Could not add participant",
      });
      throw e;
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

  const startSession = async () => {
    if (!interview) return;
    const { isPast } = countdownParts(interview.scheduledAt, Date.now());
    if (!isPast) {
      const ok = confirm(
        `This session is scheduled for ${formatDateTime(interview.scheduledAt)}.\n\n` +
          `Starting now runs the interview ${formatCountdown(interview.scheduledAt)} early. Continue?`,
      );
      if (!ok) return;
    }
    try {
      setBusy(true);
      setMessage(null);
      await api(`/api/interviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" }),
      });
      router.push(`/interview/${id}`);
    } catch (e) {
      setMessage({
        tone: "error",
        text: e instanceof Error ? e.message : "Could not start session",
      });
      setBusy(false);
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
          title="Session Setup"
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
          title="Session Setup"
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

  const { isPast } = countdownParts(interview.scheduledAt, now);
  const canStart =
    interview.status === "scheduled" || interview.status === "in_progress";
  const candidates = participants.filter((p) => p.role === "candidate").length;
  const roomLink = origin ? `${origin}/interview/${interview.id}` : "";

  return (
    <AppShell role={me?.role ?? "interviewer"}>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow={{ label: "Scheduler" }}
          crumb="workspace / schedule / edit"
          title="Session Setup"
          description={interview.title}
          actions={<StatusBadge status={interview.status} />}
        />

        {message && (
          <div className="mt-6">
            <Banner tone={message.tone}>{message.text}</Banner>
          </div>
        )}

        {/* ── Session control ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card mt-7 p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="metric flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em]">
                <CalendarClock className="h-3.5 w-3.5 text-[#52a8ff]" />
                {interview.status === "scheduled"
                  ? "Starts in"
                  : "Scheduled for"}
              </p>
              <p className="mt-2 font-display text-2xl font-medium tracking-[-1px] text-white">
                {formatDateTime(interview.scheduledAt)}
              </p>
              <p className="metric mt-1.5 font-mono text-xs">
                {interview.status === "scheduled" ? (
                  isPast ? (
                    <span className="text-[#f5b544]">
                      start time reached — ready when you are
                    </span>
                  ) : (
                    <>
                      T-minus {formatCountdown(interview.scheduledAt, now)}
                    </>
                  )
                ) : (
                  `${interview.durationMinutes} min · ${interview.language}`
                )}
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2">
              {interview.status === "scheduled" ? (
                <button
                  onClick={startSession}
                  disabled={busy}
                  className="btn-square gap-2 py-3 px-6"
                >
                  <Play className="h-4 w-4" /> Start session
                </button>
              ) : interview.status === "in_progress" ? (
                <button
                  onClick={() => router.push(`/interview/${interview.id}`)}
                  className="btn-square gap-2 py-3 px-6"
                >
                  <ArrowUpRight className="h-4 w-4" /> Rejoin live room
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/interview/${interview.id}`)}
                  disabled={!canStart}
                  className="btn-secondary gap-2 py-3 px-6"
                >
                  Open room
                </button>
              )}
              <button
                onClick={() => router.push(`/interview/${interview.id}`)}
                className="btn-secondary gap-2 py-2.5 text-xs"
              >
                Open room without starting
              </button>
            </div>
          </div>

          {interview.status === "scheduled" && !isPast && (
            <p className="metric mt-5 border-t border-white/[0.145] pt-4 text-[11px]">
              The session is scheduled, not live. Nothing is recorded and no one can
              connect until you press Start — it is currently{" "}
              {formatCountdown(interview.scheduledAt, now)} away.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="card mt-6 p-6 sm:p-8"
        >
          <InterviewForm
            initial={interview}
            onSaved={() => router.push(`/schedule/${id}`)}
          />

          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/[0.145] pt-5">
            <button
              className="btn-secondary gap-2 text-[#f5b544]"
              onClick={async () => {
                if (!confirm("Cancel this interview? All participants are notified."))
                  return;
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
            description={`${candidates} candidate${candidates === 1 ? "" : "s"} invited. Everyone added here is notified in-app and emailed.`}
            className="mt-6"
            bodyClassName="p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <UserSearch
                  onSelect={add}
                  addedIds={participants.map((p) => p.user_id)}
                  disabled={busy}
                  placeholder="Search by candidate name or email…"
                />
              </div>
              <div className="sm:w-44 sm:pb-0.5">
                <label className="label">Role</label>
                <select
                  className="select font-mono text-xs"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "candidate" | "interviewer")
                  }
                >
                  <option value="candidate">Candidate</option>
                  <option value="interviewer">Interviewer</option>
                </select>
              </div>
            </div>

            {invites.length > 0 && (
              <InviteStatusList invites={invites} joinUrl={roomLink} className="mt-6" />
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
                        icon={Users}
                        tone={p.role === "candidate" ? "accent" : "invert"}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-medium text-white">
                          {p.display_name || p.email || p.user_id}
                        </p>
                        <p className="metric truncate font-mono text-[11px]">
                          {p.role} · {p.email ?? String(p.user_id).slice(0, 8)}
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

            {candidates === 0 && (
              <p className="metric mt-4 text-[11px]">
                No candidate has been invited yet. Search above and press Invite —
                without a candidate this session cannot be joined by anyone.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.145] pt-5">
              <span className="metric text-[11px]">Room link</span>
              <code className="min-w-0 flex-1 truncate border border-white/[0.145] bg-black px-2.5 py-1.5 font-mono text-[11px] text-[#52a8ff]">
                {roomLink || `…/interview/${interview.id}`}
              </code>
              <button
                onClick={() => void navigator.clipboard?.writeText(roomLink)}
                disabled={!roomLink}
                className="btn-secondary gap-1.5 px-3 py-2 text-xs"
              >
                <Link2 className="h-3.5 w-3.5" /> Copy link
              </button>
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
