"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
export default function Audit() {
  return (
    <Protected roles={["admin"]}>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    api<any>("/api/audit?limit=50").then((r) => setLogs(r.data || []));
  }, []);
  return (
    <AppShell role="admin">
      <h1 className="page-title">Audit logs</h1>
      <p className="muted mt-1">
        Administrative activity recorded by the backend.
      </p>
      <div className="card mt-7 overflow-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">User</th>
              <th className="p-4">Time</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((x: any, i) => (
              <tr className="border-t border-line" key={x.id || i}>
                <td className="p-4 font-semibold">{x.action}</td>
                <td className="p-4">{x.entity}</td>
                <td className="p-4">{x.user_id || x.userId || "—"}</td>
                <td className="p-4">
                  {x.created_at && new Date(x.created_at).toLocaleString()}
                </td>
                <td className="max-w-xs p-4 text-xs text-muted">
                  {x.details ? JSON.stringify(x.details) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && (
          <p className="p-8 text-center text-sm text-muted">
            No audit events found.
          </p>
        )}
      </div>
    </AppShell>
  );
}
