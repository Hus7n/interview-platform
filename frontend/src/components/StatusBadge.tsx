import type { InterviewStatus } from "@/lib/types";
export default function StatusBadge({
  status,
}: {
  status: InterviewStatus | string;
}) {
  const map: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700",
    in_progress: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
