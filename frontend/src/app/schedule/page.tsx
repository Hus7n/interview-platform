"use client";
import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import InterviewForm from "@/components/InterviewForm";
import type { Interview } from "@/lib/types";
export default function Schedule() {
  return (
    <Protected roles={["admin", "interviewer"]}>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const r = useRouter();
  return (
    <AppShell role="interviewer">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <p className="text-sm font-medium text-brand">Scheduling</p>
          <h1 className="page-title mt-1">Create an interview</h1>
          <p className="muted mt-1">
            The creator is automatically added as the interviewer. Add
            candidates from the interview page.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <InterviewForm
            onSaved={(i: Interview) => r.push(`/interview/${i.id}`)}
          />
        </div>
      </div>
    </AppShell>
  );
}
