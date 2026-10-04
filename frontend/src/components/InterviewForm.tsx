"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import UserSearch from "@/components/UserSearch";
import InviteStatusList from "@/components/InviteStatusList";
import {
  userName,
  type CreateInterviewResponse,
  type Interview,
  type InviteResult,
  type User,
} from "@/lib/type";
import {
  FileText,
  Calendar,
  Clock,
  Code2,
  AlertCircle,
  Sparkles,
  Save,
  Plus,
  X,
  ArrowRight,
} from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().max(2000).optional(),
  scheduled_at: z.string().min(1, "Please select date and time"),
  duration_minutes: z.coerce.number().int().min(15).max(480),
  language: z.string().min(1),
  starter_code: z.string().max(20000).optional(),
});

type Form = z.infer<typeof schema>;

const langs = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "go",
  "rust",
  "ruby",
  "php",
  "kotlin",
  "csharp",
];

function localDate(v?: string | Date) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function InterviewForm({
  initial,
  onSaved,
}: {
  initial?: Interview;
  onSaved: (i: Interview) => void;
}) {
  const isCreate = !initial;
  const [error, setError] = useState("");
  const [invitees, setInvitees] = useState<User[]>([]);
  const [inviteRole, setInviteRole] = useState<"candidate" | "interviewer">(
    "candidate",
  );
  const [created, setCreated] = useState<CreateInterviewResponse | null>(null);
  const [invites, setInvites] = useState<InviteResult[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title || "",
      description: initial?.description || "",
      scheduled_at: localDate(initial?.scheduledAt),
      duration_minutes: initial?.durationMinutes || 60,
      language: initial?.language || "javascript",
      starter_code: initial?.starterCode || "",
    },
  });

  const submit = async (v: Form) => {
    try {
      setError("");
      const date = new Date(v.scheduled_at);
      if (Number.isNaN(date.getTime())) {
        setError("Please pick a valid date and time.");
        return;
      }
      if (date.getTime() <= Date.now()) {
        setError("Pick a date and time in the future — the session is scheduled, not started.");
        return;
      }

      const payload = {
        ...v,
        scheduled_at: date.toISOString(),
      };

      if (initial) {
        const r = await api<{ data: { interview: Interview } }>(
          `/api/interviews/${initial.id}`,
          { method: "PATCH", body: JSON.stringify(payload) },
        );
        onSaved(r.data.interview);
        return;
      }

      const r = await api<{
        data: {
          interview: CreateInterviewResponse;
          invites: InviteResult[];
          mailConfigured: boolean;
        };
      }>("/api/interviews", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          participants: invitees.map((u) => ({ user_id: u.id, role: inviteRole })),
        }),
      });

      const result = r.data.interview;

      if (!invitees.length) {
        onSaved(result);
        return;
      }

      setCreated(result);
      setInvites(r.data.invites ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save interview");
    }
  };

  /* ── Post-create summary: report the real invite outcome ── */
  if (created) {
    // The backend builds this from FRONTEND_URL so the emailed link and the
    // link shown here are guaranteed identical.
    const joinUrl = invites[0]?.joinUrl;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-start gap-3 border border-[#62c073]/40 bg-[#62c073]/10 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#62c073]" />
          <div className="min-w-0">
            <p className="font-display text-sm font-medium text-white">
              Session created and invitations dispatched
            </p>
            <p className="metric mt-1 text-xs">
              &ldquo;{created.title}&rdquo; is scheduled for{" "}
              {new Date(created.scheduledAt).toLocaleString()}. It stays{" "}
              <strong className="text-white">scheduled</strong> until you press
              Start — nothing is live yet.
            </p>
          </div>
        </div>

        <InviteStatusList invites={invites} joinUrl={joinUrl} />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSaved(created)}
            className="btn-square gap-2 py-3 px-6"
          >
            <ArrowRight className="h-4 w-4" /> Continue to session setup
          </button>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setInvites([]);
              setInvitees([]);
            }}
            className="btn-secondary gap-2 py-3 px-6"
          >
            Schedule another
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 border border-[#f43f5e]/40 bg-[#f43f5e]/10 p-4 font-mono text-xs text-[#f43f5e]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="label flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#52a8ff]" /> Interview Title
        </label>
        <input
          className="input font-sans"
          placeholder="e.g. Senior Full Stack Engineer Technical Round"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 font-mono text-xs text-[#f43f5e]">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="label flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#52a8ff]" /> Assessment Details / Scope
        </label>
        <textarea
          className="input min-h-24 leading-relaxed font-sans"
          placeholder="Describe topics, problem statement guidelines, or candidate requirements..."
          {...register("description")}
        />
      </div>

      {/* Scheduled Time & Duration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#52a8ff]" /> Date & Time
          </label>
          <input
            type="datetime-local"
            min={localDate(new Date())}
            className="input cursor-pointer font-mono text-xs"
            {...register("scheduled_at")}
          />
          {errors.scheduled_at && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">{errors.scheduled_at.message}</p>
          )}
          <p className="metric mt-1.5 text-[11px]">
            The room stays closed until this time. You can still join early as the
            organiser, but the candidate is not expected before then.
          </p>
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#52a8ff]" /> Duration (Minutes)
          </label>
          <input
            type="number"
            min={15}
            max={480}
            className="input font-mono"
            {...register("duration_minutes")}
          />
          {errors.duration_minutes && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">
              {errors.duration_minutes.message}
            </p>
          )}
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <label className="label flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5 text-[#52a8ff]" /> Primary Programming Language
        </label>
        <select className="input cursor-pointer bg-[#0a0a0a] font-mono text-xs capitalize" {...register("language")}>
          {langs.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Starter Code */}
      <div>
        <label className="label flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5 text-[#52a8ff]" /> Starter Template Code
        </label>
        <textarea
          className="input min-h-36 font-mono text-xs leading-relaxed text-[#999999]"
          placeholder="// Paste boilerplate code or function signature for candidate"
          {...register("starter_code")}
        />
      </div>

      {/* Invite candidates at creation time */}
      {isCreate && (
        <div className="border-t border-white/[0.145] pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="section-title">Invite participants</h3>
              <p className="muted mt-1 text-xs">
                Optional. Each person gets an in-app notification immediately and an
                email invitation. You can add more later.
              </p>
            </div>
            <select
              className="select w-44 font-mono text-xs"
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "candidate" | "interviewer")
              }
              aria-label="Participant role"
            >
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </div>

          <UserSearch
            label="Search workspace"
            onSelect={(u) => setInvitees((prev) => [...prev, u])}
            addedIds={invitees.map((u) => u.id)}
            placeholder="Search by candidate name or email…"
          />

          {invitees.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {invitees.map((u) => (
                <span
                  key={u.id}
                  className="chip chip-active gap-1.5 py-1.5 pl-3 pr-1.5 font-mono"
                >
                  {userName(u)} · {inviteRole}
                  <button
                    type="button"
                    onClick={() =>
                      setInvitees((prev) => prev.filter((x) => x.id !== u.id))
                    }
                    className="grid h-4 w-4 place-items-center text-[#999999] hover:text-[#f43f5e]"
                    aria-label={`Remove ${userName(u)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="btn-square w-full gap-2 py-3 px-6 sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          "Processing..."
        ) : initial ? (
          <>
            <Save className="h-4 w-4" /> Save Changes
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Create Interview Session
          </>
        )}
      </button>
    </form>
  );
}
