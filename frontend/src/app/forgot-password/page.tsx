"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { Banner } from "@/components/ui";
import { Mail, Send } from "lucide-react";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [m, setM] = useState("");
  const [e, setE] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setLoading(true);
    setM("");
    setE("");
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setM("If the email exists in our records, a reset link is on its way.");
      setEmail("");
    } catch (x) {
      setE(x instanceof Error ? x.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email to receive recovery instructions."
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Registered email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="input pl-10"
              placeholder="alex@company.com"
              required
            />
          </div>
        </div>

        {m && <Banner tone="success">{m}</Banner>}
        {e && <Banner tone="error">{e}</Banner>}

        <button className="btn-square flex w-full items-center justify-center gap-2 py-3" disabled={loading}>
          <Send className="h-4 w-4" />
          {loading ? "Sending request..." : "Send reset link"}
        </button>

        <p className="pt-1 text-center font-mono text-xs text-[#666666]">
          <Link href="/login" className="transition-colors hover:text-white">
            &larr; Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}