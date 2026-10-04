"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import {
  User as UserIcon,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordInput from "@/components/PasswordInput";

/**
 * Mirrors backend/src/utils/password.ts. Validating here means a weak password
 * is reported under the field that caused it rather than as a form-wide error.
 */
const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/\d/, "Password must include at least one number")
  .regex(/[@$!%*?&]/, "Password must include at least one special character (@$!%*?&)");

const schema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordRule,
  role: z.enum(["candidate", "interviewer"]),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: signup } = useAuth();
  const r = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "candidate" },
  });

  const submit = async (v: FormValues) => {
    try {
      setError("");
      await signup(v);
      r.replace("/login?registered=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create account");
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join technical interview rooms and collaborate in real time."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="label">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <input
              className="input pl-10 font-mono"
              placeholder="Alex Morgan"
              {...register("displayName")}
            />
          </div>
          {errors.displayName && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">
              {errors.displayName.message}
            </p>
          )}
        </div>

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
          <label className="label">
            Password
          </label>
<PasswordInput
              icon={<Lock />}
              placeholder="Minimum 8 characters"
              {...register("password")}
            />
          {errors.password && (
            <p className="mt-1 font-mono text-xs text-[#f43f5e]">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Platform Role
          </label>
          <div className="relative">
            <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
            <select
              className="input pl-10 bg-[#0a0a0a] cursor-pointer font-mono"
              {...register("role")}
            >
              <option value="candidate">Candidate (Taking Interviews)</option>
              <option value="interviewer">Interviewer (Conducting Round)</option>
            </select>
          </div>
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
            "Creating Account..."
          ) : (
            <>
              Register Workspace <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-white/[0.145] pt-4 text-center">
        <p className="text-xs text-[#999999]">
          Already have an account?{" "}
          <Link className="font-mono text-[#52a8ff] hover:underline" href="/login">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
