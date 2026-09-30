"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
export default function Verify() {
  const q = useSearchParams();
  const [e, setE] = useState("Verifying…");
  useEffect(() => {
    const t = q.get("token");
    if (!t) {
      setE("Verification token is missing.");
      return;
    }
    api(`/api/auth/verify-email?token=${encodeURIComponent(t)}`)
      .then(() => setE("Your email has been verified."))
      .catch((x) =>
        setE(x instanceof Error ? x.message : "Verification failed"),
      );
  }, [q]);
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold">Email verification</h1>
        <p className="mt-3 text-muted">{e}</p>
        <Link href="/login" className="btn-primary mt-6">
          Continue to sign in
        </Link>
      </div>
    </main>
  );
}
