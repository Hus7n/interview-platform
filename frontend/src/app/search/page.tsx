"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { userName, type Interview, type Role, type User } from "@/lib/type";

export default function Search() {
  const [q, setQ] = useState("");
  const [r, setR] = useState<{ users: User[]; interviews: Interview[] }>({
    users: [],
    interviews: [],
  });
  const [role, setRole] = useState<Role>("candidate");
  const [msg, setMsg] = useState("");
  const search = async () => {
    try {
      const [a, b] = await Promise.all([
        api<{ data: { user: User } }>("/api/auth/me"),
        api<{ data: { users: User[]; interviews: any[] } }>(
          `/api/search?q=${encodeURIComponent(q)}&limit=20`,
        ),
      ]);
      setRole(a.data.user.role);
      setR({
        users: b.data.users,
        interviews: b.data.interviews.map((i: any) => ({
          ...i,
          scheduledAt: i.scheduledAt ?? i.scheduled_at,
          createdBy: i.createdBy ?? i.created_by,
          roomId: i.roomId ?? i.room_id,
          durationMinutes: i.durationMinutes ?? i.duration_minutes,
          starterCode: i.starterCode ?? i.starter_code,
          participantCount: i.participantCount ?? i.participant_count,
        })),
      });
      setMsg("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Search failed");
    }
  };
  useEffect(() => {
    search();
  }, []);
  return (
    <AppShell role={role}>
      <h1 className="page-title">Global search</h1>
      <p className="muted mt-1">Search people and interviews you can access.</p>
      <div className="mt-6 flex gap-2">
        <input
          className="input mt-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search by name, email or interview title…"
        />
        <button onClick={search} className="btn-primary">
          Search
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="border-b border-line p-5 font-bold">People</h2>
          {r.users.map((u) => (
            <div className="border-b border-line p-4 last:border-0" key={u.id}>
              <div>
                <p className="font-semibold">{userName(u)}</p>
                <p className="text-xs text-muted">
                  {u.email} · {u.role}
                </p>
              </div>
            </div>
          ))}
          {!r.users.length && (
            <p className="p-6 text-sm text-muted">No people found.</p>
          )}
        </div>
        <div className="card">
          <h2 className="border-b border-line p-5 font-bold">Interviews</h2>
          {r.interviews.map((i) => (
            <Link
              href={`/interview/${i.id}`}
              className="block border-b border-line p-4 last:border-0 hover:bg-slate-50"
              key={i.id}
            >
              <p className="font-semibold">{i.title}</p>
              <p className="text-xs text-muted">
                {new Date(i.scheduledAt).toLocaleString()} · {i.status}
              </p>
            </Link>
          ))}
          {!r.interviews.length && (
            <p className="p-6 text-sm text-muted">No interviews found.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
