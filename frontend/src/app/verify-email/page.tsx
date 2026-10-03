"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";

type State = "checking" | "success" | "error";

function VerifyContent() {
  const q = useSearchParams();
  const [state, setState] = useState<State>("checking");
  const [msg, setMsg] = useState("Validating your verification token...");

  useEffect(() => {
    const t = q.get("token");
    if (!t) {
      setState("error");
      setMsg("Verification token is missing. Open the link from your inbox again.");
      return;
    }

    let alive = true;
    api(`/api/auth/verify-email?token=${encodeURIComponent(t)}`)
      .then(() => {
        if (!alive) return;
        setState("success");
        setMsg("Your email address is verified. You can sign in now.");
      })
      .catch((x) => {
        if (!alive) return;
        setState("error");
        setMsg(x instanceof Error ? x.message : "Verification failed");
      });

    return () => {
      alive = false;
    };
  }, [q]);

  const Icon = state === "checking" ? Loader2 : state === "success" ? CheckCircle2 : XCircle;
  const tone =
    state === "checking"
      ? "border-[#52a8ff]/40 bg-[#52a8ff]/10 text-[#52a8ff]"
      : state === "success"
        ? "border-[#62c073]/40 bg-[#62c073]/10 text-[#62c073]"
        : "border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#f43f5e]";

  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className={`mx-auto grid h-16 w-16 place-items-center border ${tone}`}
      >
        <Icon className={`h-8 w-8 ${state === "checking" ? "animate-spin" : ""}`} />
      </motion.div>

      <p className="text-sm leading-relaxed text-[#999999]">{msg}</p>

      {state !== "checking" && (
        <Link
          href="/login"
          className="btn-square flex w-full items-center justify-center gap-2 py-3"
        >
          Continue to sign in <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function Verify() {
  return (
    <AuthLayout title="Email verification" subtitle="Validating workspace credentials...">
      <Suspense
        fallback={
          <p className="text-center font-mono text-xs text-[#666666]">
            Verifying session...
          </p>
        }
      >
        <VerifyContent />
      </Suspense>
    </AuthLayout>
  );
}