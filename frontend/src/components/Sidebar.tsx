"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/type";
const base = [
  ["Dashboard", "/dashboard", "▦"],
  ["Interviews", "/interviews", "▣"],
  ["Schedule", "/schedule", "＋"],
  ["Notifications", "/notifications", "◉"],
  ["Search", "/search", "⌕"],
];
export default function Sidebar({ role }: { role: Role }) {
  const items = [
    ...base,
    ...(role === "admin"
      ? [
          ["Admin", "/admin", "⚙"],
          ["Analytics", "/admin/analytics", "◒"],
          ["Audit Logs", "/admin/audit", "≡"],
        ]
      : []),
  ];
  const path = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-line px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">
            I
          </div>
          <span className="font-bold">InterviewOS</span>
        </div>
        <nav className="space-y-1 p-4">
          {items.map(([label, href, icon]) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${path === href || path.startsWith(href + "/") ? "bg-indigo-50 text-brand" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className="w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-line p-4">
          <p className="text-xs text-muted">Interview management</p>
          <p className="mt-1 text-xs text-slate-400">Video • Code • Feedback</p>
        </div>
      </div>
    </aside>
  );
}
