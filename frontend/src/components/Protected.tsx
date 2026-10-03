"use client";

import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
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

  if (loading || !user) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-black">
        <div className="glow-radial pointer-events-none absolute inset-0" />
        <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center gap-4"
        >
          <span className="grid h-10 w-10 place-items-center bg-white text-[#121212]">
            <Code2 className="h-5 w-5" />
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#666666]">
            Authenticating workspace session
          </p>
          <span className="h-px w-40 overflow-hidden bg-white/10">
            <motion.span
              className="block h-full w-1/3 bg-[#52a8ff]"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            />
          </span>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
