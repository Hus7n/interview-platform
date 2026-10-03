"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import {
  Banner,
  EmptyState,
  IconTile,
  PageHeader,
  SectionCard,
  SkeletonRows,
  StatTile,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Interview, Role, User } from "@/lib/type";
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  Filter,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  Video,
} from "lucide-react";

export default function Admin() {
  return (
    <Protected roles={["admin"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const [users, setUsers] = useState<User[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [u, i] = await Promise.all([
        api<{ data: { users: User[] } | User[] }>("/api/admin/users?limit=50"),
        api<{ data: { interviews: Interview[] } | Interview[] }>(
          "/api/admin/interviews?limit=20",
        ),
      ]);
      const uu = u?.data;
      const ii = i?.data;
      setUsers(Array.isArray(uu) ? uu : (uu?.users ?? []));
      setInterviews(Array.isArray(ii) ? ii : (ii?.interviews ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load admin console");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError("");
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const update = (id: string, patch: Record<string, unknown>) =>
    run(() =>
      api(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    );

  const remove = (u: User) => {
    const name = u.displayName ?? u.display_name ?? u.email;
    if (!confirm(`Delete ${name}? This permanently removes the account.`)) return;
    void run(() => api(`/api/admin/users/${u.id}`, { method: "DELETE" }));
  };

  const shown = useMemo(
    () =>
      users.filter((u) => {
        if (role && u.role !== role) return false;
        if (!query) return true;
        const name = u.displayName ?? u.display_name ?? "";
        return `${name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
      }),
    [users, role, query],
  );

  const activeCount = users.filter((u) => (u.isActive ?? u.is_active) !== false).length;

  return (
    <AppShell role="admin">
      <PageHeader
        eyebrow={{ label: "Admin Console", tone: "warn" }}
        crumb="workspace / admin"
        title="Platform Administration"
        description="Manage user roles and permissions, and monitor every interview room on the platform."
        actions={
          <>
            <Link href="/admin/analytics" className="btn-secondary gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </Link>
            <Link href="/admin/audit" className="btn-secondary gap-2">
              <FileText className="h-4 w-4" /> Audit Logs
            </Link>
          </>
        }
      />

      {error && (
        <div className="mt-6">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          index={0}
          label="Total Users"
          value={users.length}
          icon={Users}
          hint="registered accounts"
        />
        <StatTile
          index={1}
          label="Interviews"
          value={interviews.length}
          icon={Video}
          tone="invert"
          hint="most recent rooms"
        />
        <StatTile
          index={2}
          label="Active Accounts"
          value={activeCount}
          icon={UserCheck}
          tone="success"
          hint="not disabled by an admin"
        />
        <StatTile
          index={3}
          label="Admins"
          value={users.filter((u) => u.role === "admin").length}
          icon={ShieldAlert}
          tone="warn"
          hint="full platform access"
        />
      </div>

      <SectionCard
        icon={Users}
        title={`User Directory (${shown.length})`}
        description="Change a role or toggle account access."
        className="mt-6"
        bodyClassName="divide-y divide-white/[0.145]"
      >
        <div className="flex flex-col gap-3 border-b border-white/[0.145] p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              placeholder="Filter users by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative sm:w-52">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <select
              className="select pl-10 font-mono"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="interviewer">Interviewer</option>
              <option value="candidate">Candidate</option>
            </select>
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : shown.length ? (
          shown.map((u, idx) => {
            const name = u.displayName ?? u.display_name;
            const isActive = u.isActive ?? u.is_active;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.25) }}
                className="grid items-center gap-3 p-4 md:grid-cols-[minmax(0,1fr)_170px_130px_44px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="avatar-square h-9 w-9 font-mono text-xs">
                    {(name || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-medium tracking-[-0.5px] text-white">
                      {name || "Unnamed User"}
                    </p>
                    <p className="metric truncate text-xs">{u.email}</p>
                  </div>
                </div>

                <select
                  className="select py-2 font-mono text-xs"
                  value={u.role}
                  onChange={(e) => update(u.id, { role: e.target.value as Role })}
                >
                  <option value="admin">Admin</option>
                  <option value="interviewer">Interviewer</option>
                  <option value="candidate">Candidate</option>
                </select>

                <button
                  className={`btn-secondary justify-self-start px-3 py-2 font-mono text-[11px] ${
                    isActive === false
                      ? "border-[#62c073]/40 text-[#62c073]"
                      : ""
                  }`}
                  onClick={() => update(u.id, { is_active: isActive === false })}
                >
                  {isActive === false ? "Activate" : "Disable"}
                </button>

                <button
                  className="btn-icon text-[#f43f5e]"
                  title={`Delete ${u.email}`}
                  onClick={() => remove(u)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })
        ) : (
          <EmptyState
            icon={Users}
            title="No users match"
            description="Adjust the role filter or clear your search term."
          />
        )}
      </SectionCard>

      <SectionCard
        icon={Video}
        title="Recent Platform Interviews"
        description="Every room created on the workspace, newest first."
        className="mt-6"
        action={
          <Link
            href="/interviews"
            className="flex items-center gap-1 font-mono text-xs text-[#52a8ff] hover:underline"
          >
            All interviews <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
        bodyClassName="divide-y divide-white/[0.145]"
      >
        {loading ? (
          <SkeletonRows rows={3} />
        ) : interviews.length ? (
          interviews.map((i) => (
            <Link
              key={i.id}
              href={`/interview/${i.id}`}
              className="row-hover flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-medium tracking-[-0.5px] text-white">
                  {i.title}
                </p>
                <p className="metric mt-1 text-xs">
                  {i.language} ·{" "}
                  {i.scheduledAt
                    ? new Date(i.scheduledAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "unscheduled"}{" "}
                  · {i.participantCount ?? 0} participants
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={i.status} />
                <IconTile icon={ArrowUpRight} tone="muted" size="sm" />
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            icon={Video}
            title="No interviews yet"
            description="Rooms created by interviewers will show up here."
          />
        )}
      </SectionCard>
    </AppShell>
  );
}
