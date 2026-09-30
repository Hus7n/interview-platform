"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Interview, User } from "@/lib/types";
export default function Dashboard() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}
function DashboardInner() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Interview[]>([]);
  const [e, setE] = useState("");
  useEffect(() => {
    Promise.all([
      api<{ data: { user: User } }>("/api/auth/me"),
      api<{ data: { interviews: Interview[] } }>(
        "/api/interviews?limit=6&page=1",
      ),
    ])
      .then(([u, i]) => {
        setUser(u.data.user);
        setItems(i.data.interviews);
      })
      .catch((x) =>
        setE(x instanceof Error ? x.message : "Unable to load dashboard"),
      );
  }, []);
  return (
    <AppShell role={user?.role || "candidate"}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Overview</p>
          <h1 className="page-title mt-1">
            Good to see you, {user?.displayName?.split(" ")[0] || "there"}.
          </h1>
          <p className="muted mt-1">
            Here is what is happening with your interviews.
          </p>
        </div>
        <Link href="/schedule" className="btn-primary">
          ＋ Schedule interview
        </Link>
      </div>
      {e && (
        <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {e}
        </div>
      )}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Upcoming",
            items.filter((x) => x.status === "scheduled").length,
            "blue",
          ],
          [
            "In progress",
            items.filter((x) => x.status === "in_progress").length,
            "amber",
          ],
          [
            "Completed",
            items.filter((x) => x.status === "completed").length,
            "green",
          ],
          ["Total shown", items.length, "indigo"],
        ].map((x) => (
          <div className="card p-5" key={x[0]}>
            <p className="text-sm text-muted">{x[0]}</p>
            <p className="mt-2 text-3xl font-bold">{x[1]}</p>
          </div>
        ))}
      </div>
      <section className="mt-7 card">
        <div className="flex items-center justify-between border-b border-line p-5">
          <div>
            <h2 className="font-bold">Recent interviews</h2>
            <p className="muted mt-1">Your latest interview activity.</p>
          </div>
          <Link href="/interviews" className="text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="divide-y divide-line">
          {items.length ? (
            items.map((i) => (
              <Link
                href={`/interview/${i.id}`}
                key={i.id}
                className="flex flex-col gap-3 p-5 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold">{i.title}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(i.scheduledAt).toLocaleString()} ·{" "}
                    {i.durationMinutes} min · {i.language}
                  </p>
                </div>
                <StatusBadge status={i.status} />
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted">
              No interviews yet.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
