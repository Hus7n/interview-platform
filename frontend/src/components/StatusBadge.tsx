"use client";

import type { InterviewStatus } from "@/lib/type";
import { AlertCircle, CheckCircle2, Clock, PlayCircle } from "lucide-react";

const styles: Record<
  string,
  { chip: string; text: string; icon: typeof Clock; label: string }
> = {
  scheduled: {
    chip: "",
    text: "text-[#999999]",
    icon: Clock,
    label: "scheduled",
  },
  in_progress: {
    chip: "chip-active",
    text: "text-[#52a8ff]",
    icon: PlayCircle,
    label: "in progress",
  },
  completed: {
    chip: "chip-success",
    text: "text-[#62c073]",
    icon: CheckCircle2,
    label: "completed",
  },
  cancelled: {
    chip: "chip-danger",
    text: "text-[#f43f5e]",
    icon: AlertCircle,
    label: "cancelled",
  },
};

export default function StatusBadge({
  status,
}: {
  status: InterviewStatus | string;
}) {
  const item = styles[status] ?? {
    chip: "",
    text: "text-[#999999]",
    icon: Clock,
    label: status,
  };
  const Icon = item.icon;

  return (
    <span className={`chip ${item.chip} font-mono`}>
      {status === "in_progress" ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#52a8ff] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#52a8ff]" />
        </span>
      ) : (
        <Icon className={`h-3 w-3 ${item.text}`} />
      )}
      {item.label}
    </span>
  );
}
