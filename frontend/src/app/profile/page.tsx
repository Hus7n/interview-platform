"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import type { User } from "@/lib/type";
export default function Profile() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const [u, setU] = useState<User>();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api<{ data: { user: User } }>("/api/auth/me").then((r) =>
      setU(r.data.user),
    );
  }, []);
  const uploadAvatar = async () => {
    if (!avatar) return;
    const fd = new FormData();
    fd.append("file", avatar);
    try {
      await api("/api/uploads/avatar", { method: "POST", body: fd });
      const r = await api<{ data: { user: User } }>("/api/auth/me");
      setU(r.data.user);
      setMsg("Avatar updated.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };
  const uploadResume = async () => {
    if (!resume) return;
    const fd = new FormData();
    fd.append("file", resume);
    try {
      const r = await api<{ data: { url: string; originalName: string } }>(
        "/api/uploads/resume",
        { method: "POST", body: fd },
      );
      setMsg(`Resume uploaded: ${r.data.originalName}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };
  const avatarUrl = u?.avatarUrl ?? u?.avatar_url;
  return (
    <AppShell role={u?.role || "candidate"}>
      <div className="max-w-2xl">
        <h1 className="page-title">Profile</h1>
        <p className="muted mt-1">Account details and document uploads.</p>
        <div className="card mt-7 p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-indigo-100 text-xl font-bold text-brand">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (u?.displayName || u?.display_name || "U").slice(0, 1)
              )}
            </div>
            <div>
              <p className="font-bold">{u?.displayName ?? u?.display_name}</p>
              <p className="text-sm text-muted">{u?.email}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setAvatar(e.target.files?.[0] || null)}
              className="input mt-0"
            />
            <button onClick={uploadAvatar} className="btn-primary">
              Upload avatar
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
              className="input mt-0"
            />
            <button onClick={uploadResume} className="btn-secondary">
              Upload resume
            </button>
          </div>
          {msg && <p className="mt-4 text-sm text-muted">{msg}</p>}
        </div>
        <div className="card mt-5 divide-y divide-line">
          {[
            ["Role", u?.role],
            [
              "Email verified",
              (u?.emailVerified ?? u?.email_verified) ? "Yes" : "No",
            ],
            [
              "Account status",
              (u?.isActive ?? u?.is_active) ? "Active" : "Disabled",
            ],
            [
              "Created",
              (u?.createdAt ?? u?.created_at) &&
                new Date((u?.createdAt ?? u?.created_at)!).toLocaleString(),
            ],
            [
              "Last login",
              (u?.lastLoginAt ?? u?.last_login_at) &&
                new Date(
                  (u?.lastLoginAt ?? u?.last_login_at)!,
                ).toLocaleString(),
            ],
          ].map(([a, b]) => (
            <div className="grid grid-cols-2 gap-4 p-5" key={String(a)}>
              <span className="text-sm text-muted">{a}</span>
              <span className="text-sm font-semibold">{String(b ?? "—")}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
