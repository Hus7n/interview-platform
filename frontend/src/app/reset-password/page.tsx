"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { Banner } from "@/components/ui";
import PasswordInput from "@/components/PasswordInput";
import { KeyRound, ShieldCheck } from "lucide-react";

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH = [
  { label: "Too short", color: "#f43f5e" },
  { label: "Weak", color: "#f43f5e" },
  { label: "Fair", color: "#f5b544" },
  { label: "Good", color: "#f5b544" },
  { label: "Strong", color: "#62c073" },
  { label: "Excellent", color: "#62c073" },
];

function ResetContent() {
  const q = useSearchParams();
  const token = q.get("token") || "";
  const r = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [e, setE] = useState("");
  const [loading, setLoading] = useState(false);

  const score = strength(password);
  const meter = STRENGTH[score];

  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setE("");
    if (password !== confirm) {
      setE("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      r.replace("/login?reset=1");
    } catch (x) {
      setE(x instanceof Error ? x.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {!token && (
        <Banner tone="error">
          This reset link is missing its security token. Request a new one.
        </Banner>
      )}

      <div>
        <label htmlFor="password" className="label">
          New password
        </label>
        <PasswordInput
          id="password"
          icon={<KeyRound />}
          name="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          placeholder="Minimum 8 characters"
          required
        />

        {password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-0.5 flex-1 transition-colors duration-300"
                  style={{ backgroundColor: i < score ? meter.color : "#1f1f1f" }}
                />
              ))}
            </div>
            <p className="metric mt-1.5 font-mono text-[10px]" style={{ color: meter.color }}>
              {meter.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirm" className="label">
          Confirm password
        </label>
        <PasswordInput
          id="confirm"
          icon={<ShieldCheck />}
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(ev) => setConfirm(ev.target.value)}
          placeholder="Repeat your password"
          required
        />
      </div>

      {e && <Banner tone="error">{e}</Banner>}

      <button
        className="btn-square flex w-full items-center justify-center gap-2 py-3"
        disabled={!token || loading}
      >
        {loading ? "Updating..." : "Update password"}
      </button>

      <p className="pt-1 text-center font-mono text-xs text-[#666666]">
        <Link href="/login" className="transition-colors hover:text-white">
          &larr; Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function Reset() {
  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your workspace account."
    >
      <Suspense
        fallback={
          <p className="text-center font-mono text-xs text-[#666666]">
            Loading reset session...
          </p>
        }
      >
        <ResetContent />
      </Suspense>
    </AuthLayout>
  );
}