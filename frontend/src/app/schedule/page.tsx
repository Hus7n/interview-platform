"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import InterviewForm from "@/components/InterviewForm";
import { IconTile, PageHeader } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import type { Interview } from "@/lib/type";
import { CalendarPlus, Code2, Clock, Video } from "lucide-react";

export default function Schedule() {
  return (
    <Protected roles={["admin", "interviewer"]}>
      <Inner />
    </Protected>
  );
}

function Inner() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <AppShell role={user?.role ?? "interviewer"}>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow={{ label: "Scheduler" }}
          crumb="workspace / schedule"
          title="Schedule Technical Interview"
          description="Configure the session, pick a programming language, and initialise starter code for the room."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="card mt-7 p-6 sm:p-8"
        >
          <InterviewForm
            onSaved={(i: Interview) => router.push(`/interview/${i.id}`)}
          />
        </motion.div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Video, label: "Room created", hint: "WebRTC link generated" },
            { icon: Code2, label: "Monaco editor", hint: "starter code preloaded" },
            { icon: Clock, label: "Reminders sent", hint: "email + in-app invites" },
          ].map((x, i) => (
            <motion.div
              key={x.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="card flex items-start gap-3 p-4"
            >
              <IconTile icon={x.icon} tone="muted" size="sm" />
              <div>
                <p className="font-display text-sm font-medium tracking-[-0.5px] text-white">
                  {x.label}
                </p>
                <p className="metric mt-0.5 text-[11px]">{x.hint}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="metric mt-6 flex items-center gap-2 text-[11px]">
          <CalendarPlus className="h-3.5 w-3.5 text-[#666666]" />
          Interviews must be scheduled in the future. Cancelled rooms keep their
          scorecards.
        </p>
      </div>
    </AppShell>
  );
}
