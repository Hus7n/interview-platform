"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Interview } from "@/lib/type";
import {
  FileText,
  Calendar,
  Clock,
  Code2,
  AlertCircle,
  Sparkles,
  Save,
  Plus,
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
      const date = new Date(v.scheduled_at);
      if (Number.isNaN(date.getTime())) {
        setError("Please pick a valid date and time.");
        return;
      }
      const r = await api<{ data: { interview: Interview } }>(
        initial ? `/api/interviews/${initial.id}` : "/api/interviews",
        {
          method: initial ? "PATCH" : "POST",
          body: JSON.stringify({
            ...v,
            scheduled_at: date.toISOString(),
          }),
        }
      );
      onSaved(r.data.interview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save interview");
    }
  };

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
            className="input cursor-pointer font-mono text-xs"
            {...register("scheduled_at")}
          />
          {errors.scheduled_at && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">{errors.scheduled_at.message}</p>
          )}
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

      <button className="btn-square w-full sm:w-auto gap-2 py-3 px-6" disabled={isSubmitting}>
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
        )
        }
      </button>
    </form>
  );
}
