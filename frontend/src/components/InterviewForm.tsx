"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Interview } from "@/lib/type";
const schema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional(),
  scheduled_at: z.string().min(1),
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
function localDate(v?: string) {
  if (!v) return "";
  const d = new Date(v);
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
  const [error, setError] = useState("");
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
      const r = await api<{ data: { interview: Interview } }>(
        initial ? `/api/interviews/${initial.id}` : "/api/interviews",
        {
          method: initial ? "PATCH" : "POST",
          body: JSON.stringify({
            ...v,
            scheduled_at: new Date(v.scheduled_at).toISOString(),
          }),
        },
      );
      onSaved(r.data.interview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save interview");
    }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label className="label">Interview title</label>
        <input
          className="input"
          placeholder="Senior Frontend Engineer"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-24"
          placeholder="What will be assessed?"
          {...register("description")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Scheduled at</label>
          <input
            type="datetime-local"
            className="input"
            {...register("scheduled_at")}
          />
        </div>
        <div>
          <label className="label">Duration (minutes)</label>
          <input
            type="number"
            className="input"
            {...register("duration_minutes")}
          />
        </div>
      </div>
      <div>
        <label className="label">Language</label>
        <select className="input" {...register("language")}>
          {langs.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Starter code</label>
        <textarea
          className="input min-h-36 font-mono text-xs"
          placeholder="// candidate starts here"
          {...register("starter_code")}
        />
      </div>
      <button className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting
          ? initial
            ? "Saving…"
            : "Creating…"
          : initial
            ? "Save changes"
            : "Create interview"}
      </button>
    </form>
  );
}
