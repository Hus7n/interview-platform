"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import {
  Banner,
  EmptyState,
  PageHeader,
  SkeletonRows,
} from "@/components/ui";
import { api } from "@/lib/api";
import { FileText, Filter, Search } from "lucide-react";

type AuditRow = {
  id?: string;
  action?: string;
  entity?: string;
  entity_id?: string | null;
  user_id?: string | null;
  created_at?: string;
  details?: Record<string, unknown> | null;
};

export default function Audit() {
  return (
    <Protected roles={["admin"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const q = new URLSearchParams({ limit: "50" });
      if (action) q.set("action", action);
      if (entity) q.set("entity", entity);

      const r = await api<{ data: AuditRow[] }>(`/api/audit?${q.toString()}`);
      setLogs(r?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [action, entity]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell role="admin">
      <PageHeader
        eyebrow={{ label: "Forensics" }}
        crumb="workspace / admin / audit"
        title="Audit Logs"
        description="Every privileged action recorded by the backend, newest first."
      />

      {error && (
        <div className="mt-6">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="card mt-7 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              placeholder="Filter by action (e.g. user.role_update)…"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <select
              className="select pl-10 font-mono"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="user">User</option>
              <option value="interview">Interview</option>
              <option value="feedback">Feedback</option>
              <option value="auth">Auth</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.145] bg-black font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666]">
                <th className="p-4 font-normal">Action</th>
                <th className="p-4 font-normal">Entity</th>
                <th className="p-4 font-normal">Actor</th>
                <th className="p-4 font-normal">Timestamp</th>
                <th className="p-4 font-normal">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.145]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <SkeletonRows rows={5} />
                  </td>
                </tr>
              ) : (
                logs.map((l, i) => (
                  <motion.tr
                    key={l.id ?? i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    className="row-hover"
                  >
                    <td className="p-4">
                      <span className="chip chip-active font-mono">
                        {l.action ?? "unknown"}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-[#999999]">
                      {l.entity ?? "—"}
                      {l.entity_id ? (
                        <span className="ml-1 text-[#666666]">
                          · {String(l.entity_id).slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4 font-mono text-xs text-[#999999]">
                      {l.user_id ? String(l.user_id).slice(0, 8) : "system"}
                    </td>
                    <td className="metric whitespace-nowrap p-4 font-mono text-xs">
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="max-w-xs p-4">
                      <code className="metric block break-words font-mono text-[11px]">
                        {l.details ? JSON.stringify(l.details) : "—"}
                      </code>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !logs.length && (
          <EmptyState
            icon={FileText}
            title="No audit events"
            description="Privileged actions will be recorded here as they happen."
          />
        )}
      </div>
    </AppShell>
  );
}
