"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";


export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-black px-4 py-12 text-white">
      {/* Radial background glow */}
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
          className="mx-auto mb-6 flex w-fit items-center gap-2.5 font-display text-lg font-medium tracking-[-1px] text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-none bg-white text-[#121212]">
            <Code2 className="h-4 w-4" />
          </span>
          InterviewOS
          <span className="chip">beta</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-medium tracking-[-2px] text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-[#999999]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-[#666666]">
          Encrypted sessions · JWT auth · Role-based access
        </p>
      </motion.div>
    </main>
  );
}

export default AuthLayout;
