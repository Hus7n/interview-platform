"use client";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/type";
export default function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth(true, roles);
  if (loading || !user)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Loading workspace…
      </div>
    );
  return <>{children}</>;
}
