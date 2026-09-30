"use client";
import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
export default function Analytics() {
  return (
    <Protected roles={["admin"]}>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const [d, setD] = useState<any>({});
  const [lang, setLang] = useState<any[]>([]);
  const [month, setMonth] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([
      api<any>("/api/analytics/dashboard"),
      api<any>("/api/analytics/by-language"),
      api<any>("/api/analytics/by-month"),
      api<any>("/api/analytics/top-interviewers"),
    ]).then(([a, b, c, d]) => {
      setD(a.data);
      setLang(b.data || []);
      setMonth(c.data || []);
      setTop(d.data || []);
    });
  }, []);
  return (
    <AppShell role="admin">
      <h1 className="page-title">Analytics</h1>
      <p className="muted mt-1">Platform-level interview and hiring metrics.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(d).map(([k, v]) => (
          <div className="card p-5" key={k}>
            <p className="text-xs uppercase tracking-wide text-muted">
              {k.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {typeof v === "number" ? v : String(v ?? "—")}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        <Data title="Interviews by language" data={lang} />
        <Data title="Interviews by month" data={month} />
        <Data title="Top interviewers" data={top} />
      </div>
    </AppShell>
  );
}
function Data({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="card overflow-hidden">
      <h2 className="border-b border-line p-5 font-bold">{title}</h2>
      <div>
        {data.length ? (
          data.map((x: any, i) => (
            <div
              key={i}
              className="flex justify-between border-b border-line p-4 text-sm last:border-0"
            >
              <span>
                {x.language ||
                  x.month ||
                  x.display_name ||
                  x.name ||
                  x.email ||
                  Object.values(x)[0]}
              </span>
              <span className="font-semibold">
                {x.count ?? x.total ?? x.interviews ?? Object.values(x)[1]}
              </span>
            </div>
          ))
        ) : (
          <p className="p-6 text-sm text-muted">No data yet.</p>
        )}
      </div>
    </div>
  );
}
