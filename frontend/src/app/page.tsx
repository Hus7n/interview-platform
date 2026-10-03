"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code2,
  Video,
  PenTool,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Terminal,
  Award,
} from "lucide-react";


const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"editor" | "video" | "board">(
    "editor",
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Radial glow + grid */}
      <div className="glow-radial pointer-events-none absolute inset-0" />
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2"
        >
          <span className="chip">new</span>
          <span className="font-mono text-xs text-[#999999]">
            motion.dev engine · realtime interview OS
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mx-auto mt-6 max-w-4xl font-display text-5xl font-medium leading-[1.05] tracking-[-3.36px] text-white sm:text-6xl lg:text-7xl"
        >
          Technical interviews,
          <br />
          <span className="text-[#52a8ff]">reimagined.</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#999999] sm:text-lg"
        >
          Low-latency WebRTC video, a collaborative Monaco editor, live
          whiteboards and instant code execution — one brutalist workspace for
          evaluating engineers.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <Link href="/register" className="btn-square gap-2 px-8 py-3.5">
            Start Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3.5">
            Sign In
          </Link>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-[#666666]"
        >
          {[
            "WebRTC audio & video",
            "Monaco multi-language editor",
            "Socket.io live sync",
          ].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#62c073]" />
              {t}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Workspace showcase with scrim */}
      <section
        id="technology"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden border border-white/[0.145] bg-[#0a0a0a]"
        >
          {/* Window chrome */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.145] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f5b544]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#62c073]" />
              <span className="ml-2 font-mono text-xs text-[#666666]">
                interview-session-3891.ts
              </span>
            </div>

            <div className="flex border border-white/[0.145] bg-black p-0.5 text-xs">
              {(
                [
                  ["editor", "Editor", Code2],
                  ["video", "Video", Video],
                  ["board", "Board", PenTool],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-all ${
                    activeTab === id
                      ? "bg-white font-semibold text-[#121212]"
                      : "text-[#999999] hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="grid min-h-[380px] gap-4 p-4 lg:grid-cols-3">
            <div className="relative flex flex-col justify-between overflow-hidden border border-white/[0.145] bg-black p-5 font-mono text-xs lg:col-span-2">
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.145] pb-3 text-[#666666]">
                  <span className="text-[#52a8ff]">
                    // two-sum · optimized
                  </span>
                  <span className="chip">typescript</span>
                </div>
                <pre className="mt-4 leading-relaxed text-[#999999]">
                  <span className="text-[#52a8ff]">function</span>{" "}
                  <span className="text-white">twoSum</span>(nums:{" "}
                  <span className="text-[#62c073]">number[]</span>, target:{" "}
                  <span className="text-[#62c073]">number</span>):{" "}
                  <span className="text-[#62c073]">number[]</span> &#123;
                  <br />
                  &nbsp;&nbsp;
                  <span className="text-[#52a8ff]">const</span> map ={" "}
                  <span className="text-[#52a8ff]">new</span>{" "}
                  <span className="text-white">Map</span>&lt;
                  <span className="text-[#62c073]">number</span>,{" "}
                  <span className="text-[#62c073]">number</span>&gt;();
                  <br />
                  &nbsp;&nbsp;
                  <span className="text-[#52a8ff]">for</span> (
                  <span className="text-[#52a8ff]">let</span> i = 0; i &lt;
                  nums.length; i++) &#123;
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-[#52a8ff]">const</span> complement =
                  target - nums[i];
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-[#52a8ff]">if</span> (map.has(complement)) &#123;
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="text-[#52a8ff]">return</span>{" "}
                  [map.get(complement)!, i];
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&#125;
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;map.set(nums[i], i);
                  <br />
                  &nbsp;&nbsp;&#125;
                  <br />
                  &nbsp;&nbsp;
                  <span className="text-[#52a8ff]">return</span> [];
                  <br />
                  &#125;
                </pre>
              </div>
              <div className="mt-6 flex items-center justify-between border border-white/[0.145] bg-[#0a0a0a] p-3">
                <span className="flex items-center gap-2 font-mono text-[#62c073]">
                  <Terminal className="h-4 w-4" />
                  5/5 cases passed · 0.42ms
                </span>
                <button className="btn-square gap-1.5 py-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Run Tests
                </button>
              </div>

              {/* Scrim gradient overlay for hero image area */}
              <div className="scrim pointer-events-none absolute inset-x-0 bottom-0 h-24" />
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div className="flex h-44 flex-col justify-between border border-white/[0.145] bg-[#0a0a0a] p-4">
                <div className="flex items-center justify-between">
                  <span className="chip chip-success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#62c073]" />
                    live
                  </span>
                  <span className="font-mono text-xs text-[#999999]">
                    alex.morgan
                  </span>
                </div>
                <div className="mx-auto grid h-16 w-16 place-items-center bg-white text-xl font-semibold text-[#121212]">
                  AM
                </div>
                <div className="flex justify-center gap-2 font-mono text-[10px] text-[#666666]">
                  <span className="border border-white/[0.145] px-2 py-0.5">
                    cam on
                  </span>
                  <span className="border border-white/[0.145] px-2 py-0.5">
                    mic on
                  </span>
                </div>
              </div>

              <div className="flex-1 border border-white/[0.145] bg-[#0a0a0a] p-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#999999]">
                  <Award className="h-3.5 w-3.5 text-[#52a8ff]" />
                  evaluator note
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#666666]">
                  Hash-map approach, optimal O(n). Clear communication of trade
                 -offs; strong system-design follow-up.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wider text-[#52a8ff]">
            // features
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-[-2px] text-white sm:text-4xl">
            Engineered for modern engineering teams
          </h2>
          <p className="mt-3 text-sm text-[#999999] sm:text-base">
            Everything you need to evaluate candidates fairly, efficiently and
            collaboratively.
          </p>
        </div>

        <div className="mt-12 grid gap-px border border-white/[0.145] bg-white/[0.145] md:grid-cols-3">
          {[
            {
              icon: Video,
              title: "WebRTC Video & Audio",
              desc: "Peer-to-peer low-latency media with instant screen sharing.",
            },
            {
              icon: Code2,
              title: "Monaco Code Workspace",
              desc: "12+ languages with real-time multi-cursor sync.",
            },
            {
              icon: PenTool,
              title: "Interactive Whiteboard",
              desc: "Collaborative canvas for system design and diagrams.",
            },
            {
              icon: ShieldCheck,
              title: "Structured Scorecards",
              desc: "Standardized ratings, private notes and recommendations.",
            },
            {
              icon: Zap,
              title: "Instant Code Execution",
              desc: "Run code against test cases with runtime metrics.",
            },
            {
              icon: Terminal,
              title: "Motion.dev Animation",
              desc: "Spring physics, 60 FPS transitions, inspector tools.",
            },
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group bg-[#0a0a0a] p-6 transition-colors hover:bg-[#141414]"
              >
                <div className="grid h-10 w-10 place-items-center border border-white/[0.145] bg-black text-[#52a8ff] transition-colors group-hover:border-[#52a8ff]/50">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-base font-medium tracking-[-1px] text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#999999]">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-y border-white/[0.145] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-[-2px] text-white sm:text-3xl">
              Ready to run your next loop?
            </h2>
            <p className="mt-2 font-mono text-xs text-[#999999]">
              Free for interviewers · no credit card required
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="btn-square gap-2 px-6 py-3">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-[#666666] sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-mono">
            <Code2 className="h-4 w-4 text-[#52a8ff]" />
            InterviewOS © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="transition-colors hover:text-white">
              Sign In
            </Link>
            <Link href="/register" className="transition-colors hover:text-white">
              Register
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
