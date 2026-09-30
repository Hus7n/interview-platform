"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import InterviewForm from "@/components/InterviewForm";
import { api } from "@/lib/api";
import { userName, type Interview, type Participant, type User } from "@/lib/type";

export default function Edit() {
  return (
    <Protected roles={["admin", "interviewer"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const r = useRouter();
  const [i, setI] = useState<Interview>();
  const [e, setE] = useState("");
  const [me, setMe] = useState<User>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [inviteRole, setInviteRole] = useState<"candidate" | "interviewer">(
    "candidate",
  );
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const loadParticipants = async () => {
    try {
      const x = await api<{ data: { participants: Participant[] } }>(
        `/api/interviews/${id}/participants`,
      );
      setParticipants(x.data.participants || []);
    } catch {}
  };
  useEffect(() => {
    Promise.all([
      api<{ data: { interview: Interview } }>(`/api/interviews/${id}`),
      api<{ data: { user: User } }>("/api/auth/me"),
    ])
      .then(([a, b]) => {
        setI(a.data.interview);
        setMe(b.data.user);
      })
      .catch((x) => setE(x instanceof Error ? x.message : "Unable to load"));
    loadParticipants();
  }, [id]);
  const searchUsers = async () => {
    if (q.trim().length < 2) {
      setUsers([]);
      return;
    }
    try {
      const x = await api<{ data: { users: User[] } }>(
        `/api/search?q=${encodeURIComponent(q.trim())}&limit=20`,
      );
      setUsers(x.data.users || []);
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "User search failed");
    }
  };
  const add = async (u: User) => {
    try {
      setBusy(true);
      setMsg("");
      await api(`/api/interviews/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({ user_id: u.id, role: inviteRole }),
      });
      setMsg(`${userName(u)} added as ${inviteRole}.`);
      setUsers([]);
      setQ("");
      await loadParticipants();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Could not add participant");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (p: Participant) => {
    if (!confirm("Remove this participant?")) return;
    try {
      await api(`/api/interviews/${id}/participants`, {
        method: "DELETE",
        body: JSON.stringify({ user_id: p.user_id }),
      });
      await loadParticipants();
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Could not remove participant");
    }
  };
  const canManage =
    !!me &&
    !!i &&
    (me.role === "admin" || i.createdBy === me.id || i.created_by === me.id);
  return (
    <AppShell role={me?.role || "interviewer"}>
      <div className="mx-auto max-w-4xl">
        <h1 className="page-title">Edit interview</h1>
        {e && <p className="mt-4 text-sm text-red-600">{e}</p>}
        {i && (
          <div className="mt-7 space-y-6">
            <div className="card p-6 sm:p-8">
              <InterviewForm
                initial={i}
                onSaved={() => r.push(`/interview/${id}`)}
              />
              <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
                <button
                  className="btn-secondary text-amber-700"
                  onClick={async () => {
                    if (confirm("Cancel this interview?")) {
                      await api(`/api/interviews/${id}/status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "cancelled" }),
                      });
                      r.push(`/interview/${id}`);
                    }
                  }}
                >
                  Cancel interview
                </button>
                <button
                  className="btn-secondary text-red-600"
                  onClick={async () => {
                    if (confirm("Delete this interview permanently?")) {
                      await api(`/api/interviews/${id}`, { method: "DELETE" });
                      r.push("/interviews");
                    }
                  }}
                >
                  Delete interview
                </button>
              </div>
            </div>
            {canManage && (
              <div className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold">Participants</h2>
                    <p className="muted mt-1">
                      Add candidates or interviewers to this interview.
                    </p>
                  </div>
                  <select
                    className="input mt-0 w-36"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(
                        e.target.value as "candidate" | "interviewer",
                      )
                    }
                  >
                    <option value="candidate">Candidate</option>
                    <option value="interviewer">Interviewer</option>
                  </select>
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    className="input mt-0"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                    placeholder="Search by name or email…"
                  />
                  <button onClick={searchUsers} className="btn-primary">
                    Search
                  </button>
                </div>
                {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
                {users.length > 0 && (
                  <div className="mt-3 divide-y rounded-lg border border-line">
                    {users
                      .filter(
                        (u) => !participants.some((p) => p.user_id === u.id),
                      )
                      .map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between gap-4 p-3"
                        >
                          <div>
                            <p className="font-semibold">{userName(u)}</p>
                            <p className="text-xs text-muted">
                              {u.email} · {u.role}
                            </p>
                          </div>
                          <button
                            disabled={busy}
                            onClick={() => add(u)}
                            className="btn-primary"
                          >
                            Add participant
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                <div className="mt-5">
                  <p className="label">Current participants</p>
                  <div className="mt-2 divide-y rounded-lg border border-line">
                    {participants.map((p) => (
                      <div
                        key={p.user_id}
                        className="flex items-center justify-between gap-4 p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {p.display_name || p.email || p.user_id}
                          </p>
                          <p className="text-xs text-muted">{p.role}</p>
                        </div>
                        <button
                          onClick={() => remove(p)}
                          className="text-sm text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {!participants.length && (
                      <p className="p-4 text-sm text-muted">
                        No participants yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
