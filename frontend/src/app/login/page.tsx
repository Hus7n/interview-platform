"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
const s = z.object({ email: z.string().email(), password: z.string().min(8) });
type F = z.infer<typeof s>;
export default function Login() {
  const { login } = useAuth();
  const r = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<F>({ resolver: zodResolver(s) });
  const submit = async (v: F) => {
    try {
      setError("");
      const u = await login(v.email, v.password);
      r.replace(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    }
  };
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your interview workspace."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <Field label="Email" error={errors.email?.message}>
          <input className="input" type="email" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input className="input" type="password" {...register("password")} />
        </Field>
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <button className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link className="font-semibold text-brand" href="/register">
          Create one
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link
          className="text-xs text-muted hover:text-brand"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </p>
    </AuthCard>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit items-center gap-2 font-bold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
            I
          </span>
          InterviewOS
        </Link>
        <div className="card p-7">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </main>
  );
}
