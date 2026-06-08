'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold"
      >
        Technical Interviews,{' '}
        <span className="text-primary">Simplified</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 text-lg text-gray-400"
      >
        Video calls, collaborative code editor, notes, and feedback — all in one place.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex justify-center gap-4"
      >
        <Link href="/register" className="rounded-lg bg-primary px-6 py-3 font-medium hover:bg-primary-dark">
          Get Started
        </Link>
        <Link href="/login" className="rounded-lg border border-gray-700 px-6 py-3 font-medium hover:bg-gray-800">
          Login
        </Link>
      </motion.div>

      <div className="mt-20 grid gap-6 md:grid-cols-3">
        {[
          { title: 'Video Interviews', desc: 'WebRTC-powered video, audio, and screen sharing' },
          { title: 'Live Code Editor', desc: 'Collaborative Monaco editor with real-time sync' },
          { title: 'Feedback System', desc: 'Structured ratings and written feedback' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-800 bg-surface p-6 text-left">
            <h3 className="text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
