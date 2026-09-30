"use client";
import Link from "next/link";
import { motion } from "framer-motion";
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
            I
          </span>
          InterviewOS
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-brand"
          >
            TECHNICAL INTERVIEW PLATFORM
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl"
          >
            Run better technical interviews, from one workspace.
          </motion.h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Schedule interviews, collaborate on code, communicate in real time,
            capture notes, and submit structured feedback without switching
            tools.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-3">
              Create workspace
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3">
              I already have an account
            </Link>
          </div>
        </div>
        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {[
            [
              "01",
              "Interview workspace",
              "Manage schedules, participants, status and interview rooms.",
            ],
            [
              "02",
              "Live collaboration",
              "Monaco editor, code execution, chat, video and screen sharing.",
            ],
            [
              "03",
              "Hiring workflow",
              "Structured feedback, notes, notifications and admin analytics.",
            ],
          ].map((x) => (
            <div key={x[0]} className="card p-6">
              <div className="text-xs font-bold text-brand">{x[0]}</div>
              <h3 className="mt-4 text-lg font-bold">{x[1]}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{x[2]}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
