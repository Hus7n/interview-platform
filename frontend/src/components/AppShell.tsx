"use client";

import React from "react";
import { motion } from "framer-motion";
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
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex flex-1">
        <Sidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
