"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
export default function Forgot() {
  const [e, setE] = useState("");
  const [m, setM] = useState("");
  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const email = new FormData(ev.currentTarget).get("email");
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setM("If the email exists, a reset link has been created.");
      setE("");
    } catch (x) {
      setE(x instanceof Error ? x.message : "Request failed");
    }
  };
  return (
    <Auth title="Reset your password">
      <form onSubmit={submit} className="space-y-4">
        <label className="label">
          Email
          <input className="input" name="email" type="email" required />
        </label>
        {m && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {m}
          </div>
        )}
        {e && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {e}
          </div>
        )}
        <button className="btn-primary w-full">Send reset request</button>
        <Link className="block text-center text-sm text-muted" href="/login">
          Back to sign in
        </Link>
      </form>
    </Auth>
  );
}
function Auth({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="card p-7">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
