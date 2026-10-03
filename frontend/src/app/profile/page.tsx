"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import {
  Banner,
  IconTile,
  PageHeader,
  SectionCard,
  StatTile,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/lib/type";
import {
  CalendarClock,
  FileText,
  Image as ImageIcon,
  Mail,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

type Attributes = {
  label: string;
  value: string;
  tone?: "accent" | "success" | "danger" | "muted";
}[];

export default function Profile() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { user: sessionUser } = useAuth();
  const [u, setU] = useState<User | null>(sessionUser);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState<"avatar" | "resume" | null>(null);

  const loadMe = useCallback(async () => {
    try {
      const r = await api<{ data: { user: User } }>("/api/auth/me");
      setU(r.data.user);
    } catch {
      /* keep cached session user */
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const runUpload = async (kind: "avatar" | "resume", file: File | null) => {
    if (!file) {
      setMsg({ tone: "error", text: "Choose a file before uploading." });
      return;
    }
    try {
      setBusy(kind);
      setMsg(null);

      const fd = new FormData();
      fd.append("file", file);

      if (kind === "avatar") {
        await api("/api/uploads/avatar", { method: "POST", body: fd });
        await loadMe();
        setAvatar(null);
        setMsg({ tone: "success", text: "Avatar updated." });
      } else {
        const r = await api<{ data: { originalName?: string } }>(
          "/api/uploads/resume",
          { method: "POST", body: fd },
        );
        setResume(null);
        setMsg({
          tone: "success",
          text: `Resume uploaded: ${r?.data?.originalName ?? file.name}`,
        });
      }
    } catch (e) {
      setMsg({
        tone: "error",
        text: e instanceof Error ? e.message : "Upload failed",
      });
    } finally {
      setBusy(null);
    }
  };

  const name = u?.displayName ?? u?.display_name ?? "Unnamed User";
  const avatarUrl = u?.avatarUrl ?? u?.avatar_url;
  const verified = u?.emailVerified ?? u?.email_verified;
  const active = u?.isActive ?? u?.is_active;
  const created = u?.createdAt ?? u?.created_at;
  const lastLogin = u?.lastLoginAt ?? u?.last_login_at;

  const attributes: Attributes = [
    { label: "Platform Role", value: u?.role ?? "—", tone: "accent" },
    {
      label: "Email Verification",
      value: verified ? "Verified" : "Pending",
      tone: verified ? "success" : "muted",
    },
    {
      label: "Account Security",
      value: active ? "Active" : "Disabled",
      tone: active ? "success" : "danger",
    },
    {
      label: "Account Created",
      value: created ? new Date(created).toLocaleString() : "—",
      tone: "muted",
    },
    {
      label: "Last Login",
      value: lastLogin ? new Date(lastLogin).toLocaleString() : "Never",
      tone: "muted",
    },
  ];

  return (
    <AppShell role={u?.role || "candidate"}>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow={{ label: "Account" }}
          crumb="workspace / profile"
          title="Profile & Documents"
          description="Manage your identity, workspace avatar and interview documents."
        />

        {msg && (
          <div className="mt-6">
            <Banner tone={msg.tone}>{msg.text}</Banner>
          </div>
        )}

        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card mt-7 overflow-hidden"
        >
          <div className="glow-radial pointer-events-none h-24 w-full" />
          <div className="relative -mt-10 flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-end sm:p-8">
            <span className="avatar-square h-20 w-20 overflow-hidden text-2xl">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="flex flex-wrap items-center justify-center gap-2 font-display text-2xl font-medium tracking-[-2px] text-white sm:justify-start">
                {name}
                <span className="chip chip-active font-mono">{u?.role}</span>
              </h2>
              <p className="metric mt-1.5 flex items-center justify-center gap-2 text-xs sm:justify-start">
                <Mail className="h-3.5 w-3.5 text-[#666666]" />
                {u?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={verified ? "chip chip-success" : "chip chip-warn"}>
                {verified ? "verified" : "unverified"}
              </span>
              <span className={active ? "chip chip-success" : "chip chip-danger"}>
                {active ? "active" : "disabled"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatTile
            index={0}
            label="Role"
            value={u?.role ?? "—"}
            icon={ShieldCheck}
            hint="access level granted"
          />
          <StatTile
            index={1}
            label="Verification"
            value={verified ? "Verified" : "Pending"}
            icon={Mail}
            tone={verified ? "success" : "warn"}
            hint="email confirmation status"
          />
          <StatTile
            index={2}
            label="Documents"
            value="2"
            icon={FileText}
            tone="invert"
            hint="avatar + resume uploads"
          />
        </div>

        {/* Uploads */}
        <SectionCard
          icon={Upload}
          title="Documents & Media"
          description="Avatar images are resized server-side; resumes are stored as PDF."
          className="mt-5"
        >
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1.5">
                <IconTile icon={ImageIcon} tone="accent" size="sm" />
                Profile Avatar
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                className="input-file"
              />
              <button
                onClick={() => runUpload("avatar", avatar)}
                disabled={busy !== null}
                className="btn-square mt-3 w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                {busy === "avatar" ? "Uploading..." : "Upload Avatar"}
              </button>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <IconTile icon={FileText} tone="accent" size="sm" />
                Candidate Resume
              </label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                className="input-file"
              />
              <button
                onClick={() => runUpload("resume", resume)}
                disabled={busy !== null}
                className="btn-secondary mt-3 w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                {busy === "resume" ? "Uploading..." : "Upload Resume"}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Attributes */}
        <SectionCard
          icon={UserRound}
          title="System Attributes"
          description="Read-only metadata stored on your account."
        >
          <div className="divide-y divide-white/[0.145]">
            {attributes.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i }}
                className="grid grid-cols-1 gap-1 p-4 sm:grid-cols-[220px_1fr] sm:gap-4"
              >
                <span className="metric text-[11px] uppercase tracking-[0.12em]">
                  {a.label}
                </span>
                <span
                  className={`font-mono text-xs ${
                    a.tone === "success"
                      ? "text-[#62c073]"
                      : a.tone === "danger"
                      ? "text-[#f43f5e]"
                      : a.tone === "accent"
                      ? "text-[#52a8ff]"
                      : "text-[#999999]"
                  }`}
                >
                  {a.value}
                </span>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        <p className="metric mt-4 flex items-center gap-2 text-[11px]">
          <CalendarClock className="h-3.5 w-3.5 text-[#666666]" />
          Password changes are handled from the reset-password flow.
        </p>
      </div>
    </AppShell>
  );
}
