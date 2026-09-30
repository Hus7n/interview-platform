"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Protected from "@/components/Protected";
import { api } from "@/lib/api";
import type { Interview, User } from "@/lib/type";
import InterviewRoom from "@/components/InterviewRoom";
export default function Room() {
  return (
    <Protected>
      <Inner />
    </Protected>
  );
}
function Inner() {
  const { id } = useParams<{ id: string }>();
  const [i, setI] = useState<Interview>();
  const [u, setU] = useState<User>();
  const [e, setE] = useState("");
  useEffect(() => {
    Promise.all([
      api<{ data: { interview: Interview } }>(`/api/interviews/${id}`),
      api<{ data: { user: User } }>("/api/auth/me"),
    ])
      .then(([a, b]) => {
        setI(a.data.interview);
        setU(b.data.user);
      })
      .catch((x) =>
        setE(x instanceof Error ? x.message : "Unable to load room"),
      );
  }, [id]);
  if (e) return <div className="p-8 text-center text-red-600">{e}</div>;
  if (!i || !u)
    return (
      <div className="grid min-h-screen place-items-center">Loading room…</div>
    );
  return <InterviewRoom interview={i} user={u} />;
}
