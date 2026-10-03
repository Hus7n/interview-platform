"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { Role } from "@/lib/type";
import {
  LayoutDashboard,
  Video,
  CalendarPlus,
  Bell,
  Search,
  ShieldAlert,
  BarChart3,
  FileText,
  Code2,
} from "lucide-react";

export default function Sidebar({ role }: { role: Role }) {
  const path = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Interviews", href: "/interviews", icon: Video },
    { label: "Schedule", href: "/schedule", icon: CalendarPlus },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Search", href: "/search", icon: Search },
  ];

  const adminItems = [
    { label: "Admin Console", href: "/admin", icon: ShieldAlert },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Audit Logs", href: "/admin/audit", icon: FileText },
  ];

  const items = [...navItems, ...(role === "admin" ? adminItems : [])];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.145] bg-black lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.145] px-6">
          <span className="grid h-8 w-8 place-items-center rounded-none bg-white text-[#121212]">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-medium tracking-[-1px] text-white">
            InterviewOS
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              path === item.href ||
              (item.href !== "/dashboard" && path.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 border px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "border-[#52a8ff]/40 text-white"
                    : "border-transparent text-[#999999] hover:border-white/[0.145] hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActive"
                    className="absolute inset-0 -z-10 bg-[#52a8ff]/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-[#52a8ff]" : "text-[#666666]"}`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#52a8ff]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer widget */}
        <div className="border-t border-white/[0.145] p-4">
          <div className="card p-3 hover:border-white/[0.145]">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#52a8ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#62c073]" />
              Engine Online
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-[#666666]">
              WebRTC · Monaco · Socket sync
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
