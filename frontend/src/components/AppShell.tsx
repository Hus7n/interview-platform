"use client";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { Role } from "@/lib/type";
export default function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  return (
    <div className="min-h-screen">
      <div className="flex">
        <Sidebar role={role} />
        <div className="min-w-0 flex-1">
          <Header />
          <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
