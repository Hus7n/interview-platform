"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, ArrowRight, Menu, X, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App shell routes render their own navigation
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/interviews") ||
    pathname.startsWith("/schedule") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/feedback") ||
    pathname.startsWith("/interview/");

  if (isAppRoute) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.145] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-none bg-white text-[#121212] transition-colors group-hover:bg-[#52a8ff]">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-medium tracking-[-1px] text-white">
            InterviewOS
          </span>
          <span className="chip hidden sm:inline-flex">v2.0</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {[
            { href: "/", label: "Overview" },
            { href: "/#features", label: "Features" },
            { href: "/#technology", label: "Platform" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href
                  ? "text-[#52a8ff]"
                  : "text-[#999999] hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link href="/dashboard" className="btn-square gap-2">
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#999999] transition-colors hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link href="/register" className="btn-square">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="border border-white/[0.145] p-2 text-white md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-white/[0.145] bg-black px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-white"
              >
                Overview
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-square w-full"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-secondary w-full"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-square w-full"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
