"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Interview, User } from "@/lib/types";
export default function Feedback() {
  return (
    <Protected roles={["admin", "interviewer"]}>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [i, setI] = useState<Interview>();
  const [e, setE] = useState("");
  const [r, setR] = useState(5);
  const [comm, setC] = useState(5);
  const [p, setP] = useState(5);
  const [rec, setRec] = useState("hire");
  const [text, setText] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => {
    Promise.all([
      api<{ data: { interview: Interview } }>(`/api/interviews/${interviewId}`),
      api<{ data: { feedbacks: any[] } }>(
        `/api/interviews/${interviewId}/feedback?limit=50`,
      ),
    ])
      .then(([a, b]) => {
        setI(a.data.interview);
        setItems(b.data.feedbacks || []);
      })
      .catch((x) => setE(x instanceof Error ? x.message : "Unable to load"));
  }, [interviewId]);
  const submit = async () => {
    try {
      setE("");
      await api(`/api/interviews/${interviewId}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          technical_rating: r,
          communication_rating: comm,
          problem_solving_rating: p,
          recommendation: rec,
          written_feedback: text,
        }),
      });
      router.push(`/interview/${interviewId}`);
    } catch (x) {
      setE(x instanceof Error ? x.message : "Could not submit feedback");
    }
  };
  return (
    <AppShell role="interviewer">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-between">
          <div>
            <h1 className="page-title">Interview feedback</h1>
            <p className="muted mt-1">{i?.title || "Interview"}</p>
          </div>
        </div>
        {e && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {e}
          </div>
        )}
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card p-6">
            <h2 className="font-bold">Evaluation</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {[
                ["Technical", r, setR],
                ["Communication", comm, setC],
                ["Problem solving", p, setP],
              ].map(([label, val, setter]) => (
                <div key={String(label)}>
                  <label className="label">{label}</label>
                  <select
                    className="input"
                    value={val as number}
                    onChange={(e) => (setter as any)(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <label className="label">Recommendation</label>
              <select
                className="input"
                value={rec}
                onChange={(e) => setRec(e.target.value)}
              >
                <option value="hire">Hire</option>
                <option value="no_hire">No hire</option>
              </select>
            </div>
            <div className="mt-5">
              <label className="label">Written feedback</label>
              <textarea
                className="input min-h-40"
                maxLength={10000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Strengths, concerns, evidence…"
              />
            </div>
            <button onClick={submit} className="btn-primary mt-5">
              Submit feedback
            </button>
          </div>
          <div className="card p-6">
            <h2 className="font-bold">Existing feedback</h2>
            <div className="mt-4 space-y-4">
              {items.length ? (
                items.map((x: any) => (
                  <div key={x.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{x.recommendation}</span>
                      <span>
                        {x.technicalRating ?? x.technical_rating}/5 technical
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {x.writtenFeedback ??
                        x.written_feedback ??
                        "No written feedback."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No feedback submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
