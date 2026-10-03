"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useAuth } from "@/hooks/useAuth";
import type { Interview } from "@/lib/type";
import {
  Award,
  CheckCircle2,
  MessageSquare,
  Send,
  Star,
  XCircle,
} from "lucide-react";

type FeedbackRow = {
  id: string;
  recommendation: "hire" | "no_hire";
  technical_rating?: number;
  technicalRating?: number;
  communication_rating?: number;
  problem_solving_rating?: number;
  written_feedback?: string | null;
  writtenFeedback?: string | null;
  reviewer_name?: string | null;
  reviewer_email?: string;
  created_at?: string;
};

const CRITERIA = [
  { key: "technical", label: "Technical", hint: "correctness & depth" },
  { key: "communication", label: "Communication", hint: "clarity & listening" },
  { key: "problemSolving", label: "Problem Solving", hint: "approach & trade-offs" },
] as const;

export default function Feedback() {
  return (
    <Protected roles={["admin", "interviewer"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [ratings, setRatings] = useState({
    technical: 4,
    communication: 4,
    problemSolving: 4,
  });
  const [recommendation, setRecommendation] = useState<"hire" | "no_hire">("hire");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const [a, b] = await Promise.all([
        api<{ data: { interview: Interview } }>(`/api/interviews/${interviewId}`),
        api<{ data: { feedbacks: FeedbackRow[] } | FeedbackRow[] }>(
          `/api/interviews/${interviewId}/feedback?limit=50`,
        ),
      ]);
      setInterview(a?.data?.interview ?? null);
      const fb = b?.data;
      setItems(Array.isArray(fb) ? fb : (fb?.feedbacks ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load feedback");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError("");
      setOk("");
      await api(`/api/interviews/${interviewId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          technical_rating: ratings.technical,
          communication_rating: ratings.communication,
          problem_solving_rating: ratings.problemSolving,
          recommendation,
          written_feedback: text.trim() || null,
        }),
      });
      setOk("Scorecard submitted.");
      setText("");
      await load();
      router.push(`/interview/${interviewId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const avg =
    (ratings.technical + ratings.communication + ratings.problemSolving) / 3;

  return (
    <AppShell role={user?.role ?? "interviewer"}>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow={{ label: "Scorecard" }}
          crumb="workspace / feedback"
          title="Interview Feedback"
          description={interview?.title ?? "Submit a structured evaluation for this round."}
        />

        {(error || ok) && (
          <div className="mt-6">
            <Banner tone={error ? "error" : "success"}>{error || ok}</Banner>
          </div>
        )}

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.145] pb-4">
              <h2 className="section-title flex items-center gap-2">
                <IconTile icon={Award} tone="accent" size="sm" /> Evaluation
              </h2>
              <span className="chip chip-active font-mono">
                avg {avg.toFixed(1)} / 5
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {CRITERIA.map((c) => (
                <div key={c.key}>
                  <p className="label">{c.label}</p>
                  <div className="mt-1 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = n <= ratings[c.key];
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${c.label} ${n} of 5`}
                          onClick={() =>
                            setRatings((r) => ({ ...r, [c.key]: n }))
                          }
                          className={`grid h-9 w-9 place-items-center border transition-colors ${
                            active
                              ? "border-[#52a8ff]/50 bg-[#52a8ff]/10 text-[#52a8ff]"
                              : "border-white/[0.145] bg-black text-[#666666] hover:border-white/25 hover:text-white"
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${active ? "fill-current" : ""}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="metric mt-2 font-mono text-[10px]">{c.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <p className="label">Recommendation</p>
              <div className="mt-1 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["hire", "Hire", CheckCircle2, "strong signal to move forward"],
                    ["no_hire", "No Hire", XCircle, "not the right level for this role"],
                  ] as const
                ).map(([value, label, Icon, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRecommendation(value)}
                    className={`flex items-start gap-3 border p-4 text-left transition-colors ${
                      recommendation === value
                        ? value === "hire"
                          ? "border-[#62c073]/50 bg-[#62c073]/10"
                          : "border-[#f43f5e]/50 bg-[#f43f5e]/10"
                        : "border-white/[0.145] bg-[#0a0a0a] hover:border-white/25"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        recommendation === value
                          ? value === "hire"
                            ? "text-[#62c073]"
                            : "text-[#f43f5e]"
                          : "text-[#666666]"
                      }`}
                    />
                    <span>
                      <span className="block font-display text-sm font-medium tracking-[-0.5px] text-white">
                        {label}
                      </span>
                      <span className="metric mt-0.5 block text-[11px]">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="label mb-0">Written feedback</p>
                <span className="metric font-mono text-[10px]">
                  {text.length} / 10000
                </span>
              </div>
              <textarea
                className="input mt-1.5 min-h-40 leading-relaxed"
                maxLength={10000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Strengths, concerns, evidence, follow-ups…"
              />
            </div>

            <button
              onClick={submit}
              disabled={submitting || loading}
              className="btn-square mt-6 w-full gap-2 py-3"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Scorecard"}
            </button>
          </motion.section>

          <SectionCard
            icon={MessageSquare}
            title={`Submitted (${items.length})`}
            description="Visible to interviewers and admins only."
            bodyClassName="divide-y divide-white/[0.145]"
          >
            {loading ? (
              <SkeletonRows rows={3} />
            ) : items.length ? (
              items.map((f, i) => {
                const tech = f.technical_rating ?? f.technicalRating ?? 0;
                const hire = f.recommendation === "hire";
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={hire ? "chip chip-success" : "chip chip-danger"}>
                        {hire ? "hire" : "no hire"}
                      </span>
                      <span className="metric font-mono text-[11px]">
                        {tech}/5 technical
                      </span>
                    </div>
                    <p className="metric mt-2 font-mono text-[10px]">
                      {f.reviewer_name || f.reviewer_email || "reviewer"}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#999999]">
                      {f.written_feedback ??
                        f.writtenFeedback ??
                        "No written feedback."}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No feedback yet"
                description="Be the first to submit a scorecard for this round."
              />
            )}
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
