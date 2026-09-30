"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Interview, Role, User } from "@/lib/types";
import Link from "next/link";
export default function Admin() {
  return (
    <Protected roles={["admin"]}>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const [users, setUsers] = useState<User[]>([]);
  const [interviews, setI] = useState<Interview[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const load = () =>
    Promise.all([
      api<{ data: User[] }>("/api/admin/users?limit=50"),
      api<{ data: Interview[] }>("/api/admin/interviews?limit=20"),
    ]).then(([u, i]) => {
      setUsers(u.data);
      setI(i.data);
    });
  useEffect(load, []);
  const update = async (id: string, v: Partial<User>) => {
    await api(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(v),
    });
    load();
  };
  const del = async (id: string) => {
    if (confirm("Delete this user?")) {
      await api(`/api/admin/users/${id}`, { method: "DELETE" });
      load();
    }
  };
  const shown = users.filter(
    (u) =>
      (!role || u.role === role) &&
      (!search ||
        `${u.displayName ?? u.display_name} ${u.email}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  return (
    <AppShell role="admin">
      <div>
        <h1 className="page-title">Admin workspace</h1>
        <p className="muted mt-1">
          Manage users and monitor platform interviews.
        </p>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="muted">Users</p>
          <p className="mt-2 text-3xl font-bold">{users.length}</p>
        </div>
        <div className="card p-5">
          <p className="muted">Interviews</p>
          <p className="mt-2 text-3xl font-bold">{interviews.length}</p>
        </div>
        <div className="card p-5">
          <p className="muted">Active users</p>
          <p className="mt-2 text-3xl font-bold">
            {users.filter((x) => x.isActive ?? x.is_active).length}
          </p>
        </div>
      </div>
      <div className="card mt-7 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row">
          <input
            className="input mt-0"
            placeholder="Find users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input mt-0 sm:max-w-48"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All roles</option>
            <option>admin</option>
            <option>interviewer</option>
            <option>candidate</option>
          </select>
        </div>
        <div className="divide-y divide-line">
          {shown.map((u) => (
            <div
              className="grid gap-3 p-5 md:grid-cols-[1fr_150px_130px_130px]"
              key={u.id}
            >
              <div>
                <p className="font-semibold">
                  {(u.displayName ?? u.display_name) || "Unnamed"}
                </p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <select
                className="input mt-0"
                value={u.role}
                onChange={(e) => update(u.id, { role: e.target.value as Role })}
              >
                <option>admin</option>
                <option>interviewer</option>
                <option>candidate</option>
              </select>
              <button
                className="btn-secondary"
                onClick={() =>
                  update(u.id, {
                    is_active: !(u.isActive ?? u.is_active),
                  } as any)
                }
              >
                {(u.isActive ?? u.is_active) ? "Disable" : "Activate"}
              </button>
              <button className="btn-danger" onClick={() => del(u.id)}>
                Delete
              </button>
            </div>
          ))}
          {!shown.length && (
            <p className="p-8 text-center text-sm text-muted">
              No users found.
            </p>
          )}
        </div>
      </div>
      <div className="card mt-7 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="font-bold">Recent platform interviews</h2>
          <Link
            href="/admin/analytics"
            className="text-sm font-semibold text-brand"
          >
            View analytics
          </Link>
        </div>
        {interviews.map((i) => (
          <div
            className="flex flex-col justify-between gap-2 border-b border-line p-5 last:border-0 sm:flex-row sm:items-center"
            key={i.id}
          >
            <div>
              <p className="font-semibold">{i.title}</p>
              <p className="text-xs text-muted">
                {i.language} ·{" "}
                {new Date(i.scheduledAt ?? i.scheduled_at).toLocaleString()}
              </p>
            </div>
            <span className="text-xs font-semibold">{i.status}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
