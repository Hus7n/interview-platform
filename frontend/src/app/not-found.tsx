"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Code2 } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-black px-4 text-white">
      <div className="glow-radial pointer-events-none absolute inset-0" />
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit items-center gap-2.5 font-display text-lg font-medium tracking-[-1px]"
        >
          <span className="grid h-8 w-8 place-items-center bg-white text-[#121212]">
            <Code2 className="h-4 w-4" />
          </span>
          InterviewOS
          <span className="chip">beta</span>
        </Link>

        <div className="card p-8 text-center">
          <p className="font-mono text-5xl font-medium tracking-[-3px] text-[#52a8ff]">
            404
          </p>
          <h1 className="mt-4 text-xl font-medium tracking-[-1.5px]">
            Route not found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#999999]">
            This page never made it into the build. The link may be outdated, or the
            route was renamed.
          </p>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/dashboard" className="btn-square px-5 py-3">
              Go to dashboard
            </Link>
            <Link href="/" className="btn-secondary px-5 py-3">
              <ArrowLeft className="h-4 w-4" /> Back home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-[#666666]">
          Encrypted sessions · JWT auth · Role-based access
        </p>
      </motion.div>
    </main>
  );
}