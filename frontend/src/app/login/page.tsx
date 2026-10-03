"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const r = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const submit = async (v: FormValues) => {
    try {
      setError("");
      const u = await login(v.email, v.password);
      r.replace(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your technical interview workspace."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="label">
            Work Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              type="email"
              placeholder="alex@company.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">
              Password
            </label>
            <Link
              className="font-mono text-xs text-[#52a8ff] hover:underline"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 border border-[#f43f5e]/40 bg-[#f43f5e]/10 p-3 font-mono text-xs text-[#f43f5e]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          className="btn-square w-full py-3 gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Authenticating..."
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-white/[0.145] pt-4 text-center">
        <p className="text-xs text-[#999999]">
          Don't have an account yet?{" "}
          <Link className="font-mono text-[#52a8ff] hover:underline" href="/register">
            Create Account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
