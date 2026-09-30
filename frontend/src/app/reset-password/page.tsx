"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
export default function Reset() {
  const q = useSearchParams();
  const token = q.get("token") || "";
  const r = useRouter();
  const [e, setE] = useState("");
  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const p = String(new FormData(ev.currentTarget).get("password"));
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: p }),
      });
      r.replace("/login?reset=1");
    } catch (x) {
      setE(x instanceof Error ? x.message : "Reset failed");
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-7">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            className="input"
            type="password"
            name="password"
            minLength={8}
            required
            placeholder="New password"
          />
          {e && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {e}
            </div>
          )}
          <button className="btn-primary w-full" disabled={!token}>
            Update password
          </button>
          {!token && (
            <p className="text-xs text-red-600">Missing reset token.</p>
          )}
          <Link href="/login" className="block text-center text-sm text-muted">
            Back to sign in
          </Link>
        </form>
      </div>
    </main>
  );
}
