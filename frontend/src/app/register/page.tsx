"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
const s = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["candidate", "interviewer"]),
});
type F = z.infer<typeof s>;
export default function Register() {
  const { register: signup } = useAuth();
  const r = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<F>({
    resolver: zodResolver(s),
    defaultValues: { role: "candidate" },
  });
  const submit = async (v: F) => {
    try {
      setError("");
      await signup(v);
      r.replace("/login?registered=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create account");
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Choose how you will use the platform.
          </p>
          <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-4">
            <div>
              <label className="label">Display name</label>
              <input className="input" {...register("displayName")} />
              {errors.displayName && (
                <p className="text-xs text-red-600">
                  {errors.displayName.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" {...register("role")}>
                <option value="candidate">Candidate</option>
                <option value="interviewer">Interviewer</option>
              </select>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-brand">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
