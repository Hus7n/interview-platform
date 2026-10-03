"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

/* ── Page header: eyebrow chip + mono breadcrumb + editorial title ── */
export function PageHeader({
  eyebrow,
  crumb,
  title,
  description,
  actions,
}: {
  eyebrow?: { label: string; tone?: "active" | "success" | "warn" | "danger" };
  crumb?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const tone =
    eyebrow?.tone === "success"
      ? "chip-success"
      : eyebrow?.tone === "warn"
      ? "chip-warn"
      : eyebrow?.tone === "danger"
      ? "chip-danger"
      : "chip-active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {eyebrow && <span className={`chip ${tone}`}>{eyebrow.label}</span>}
          {crumb && <span className="metric text-xs">{crumb}</span>}
        </div>
        <h1 className="page-title mt-2">{title}</h1>
        {description && <p className="muted mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

/* ── Inline banner for errors / confirmations ── */
export function Banner({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const map = {
    error: {
      box: "border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#f43f5e]",
      Icon: AlertCircle,
    },
    success: {
      box: "border-[#62c073]/40 bg-[#62c073]/10 text-[#62c073]",
      Icon: CheckCircle2,
    },
    info: {
      box: "border-[#52a8ff]/40 bg-[#52a8ff]/10 text-[#52a8ff]",
      Icon: AlertCircle,
    },
  }[tone];

  const Icon = map.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 border p-4 font-mono text-xs ${map.box}`}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </motion.div>
  );
}

/* ── Square icon tile used across cards + list rows ── */
export function IconTile({
  icon: Icon,
  tone = "accent",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: "accent" | "success" | "danger" | "warn" | "muted" | "invert";
  size?: "sm" | "md" | "lg";
}) {
  const toneMap = {
    accent: "border-[#52a8ff]/40 bg-[#52a8ff]/10 text-[#52a8ff]",
    success: "border-[#62c073]/40 bg-[#62c073]/10 text-[#62c073]",
    danger: "border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#f43f5e]",
    warn: "border-[#f5b544]/40 bg-[#f5b544]/10 text-[#f5b544]",
    muted: "border-white/[0.145] bg-black text-[#666666]",
    invert: "border-white/[0.145] bg-white text-[#121212]",
  }[tone];

  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  }[size];

  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      className={`grid shrink-0 place-items-center border ${toneMap} ${sizeMap}`}
    >
      <Icon className={iconSize} />
    </span>
  );
}

/* ── Metric tile: mono label, editorial number, delta chip ── */
export function StatTile({
  label,
  value,
  icon,
  hint,
  tone = "accent",
  index = 0,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  tone?: "accent" | "success" | "danger" | "warn" | "muted" | "invert";
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="card card-hover p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="metric text-[11px] uppercase tracking-[0.12em]">
          {label}
        </span>
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      </div>
      <p className="mt-3 font-display text-3xl font-medium leading-none tracking-[-1px] text-white">
        {value}
      </p>
      {hint && <div className="metric mt-2.5 text-[11px]">{hint}</div>}
    </motion.div>
  );
}

/* ── Empty state ── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="p-14 text-center">
      <IconTile icon={Icon} tone="muted" size="lg" />
      <h3 className="mt-4 font-display text-base font-medium tracking-[-1px] text-white">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#999999]">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* ── Loading placeholder rows ── */
export function SkeletonRows({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`divide-y divide-white/[0.145] ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-5">
          <div className="skeleton h-9 w-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Card section with header row ── */
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  bodyClassName = "",
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.145] bg-black p-5">
        <div className="min-w-0">
          <h2 className="section-title flex items-center gap-2">
            {icon && <IconTile icon={icon} tone="accent" size="sm" />}
            {title}
          </h2>
          {description && <p className="muted mt-1 text-xs">{description}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
