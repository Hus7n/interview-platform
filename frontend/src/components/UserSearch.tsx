"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { userName, type User } from "@/lib/type";

/**
 * Type-ahead lookup against GET /api/search. Shared by the create-interview
 * form, the session page and the workspace search page so inviting a
 * participant looks and behaves the same everywhere.
 */
export default function UserSearch({
  onSelect,
  addedIds = [],
  disabled = false,
  placeholder = "Search by name or email…",
  autoFocus = false,
  label = "Find someone to invite",
}: {
  onSelect: (user: User) => void | Promise<void>;
  /** Already-participant user ids: rendered as "Added" and not selectable. */
  addedIds?: string[];
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const run = async () => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setError("");
      return;
    }
    try {
      setError("");
      setSearching(true);
      const r = await api<{ data: { users: User[] } }>(
        `/api/search?q=${encodeURIComponent(term)}&limit=20`,
      );
      setResults(r?.data?.users ?? []);
      if (!(r?.data?.users ?? []).length) {
        setError("No accounts match that name or email.");
      }
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const pick = async (user: User) => {
    try {
      setPendingId(user.id);
      setError("");
      await onSelect(user);
      setQuery("");
      setResults([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add that person");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#666666]" />
          <input
            className="input pl-10 font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void run();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-label={label}
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={disabled || searching}
          className="btn-square gap-2"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </button>
      </div>

      <p className="metric mt-2 text-[11px]">
        Only people with an existing account can be invited. Minimum 2 characters.
      </p>

      {error && <p className="mt-2 font-mono text-xs text-[#f43f5e]">{error}</p>}

      {results.length > 0 && (
        <div className="mt-4 divide-y divide-white/[0.145] border border-white/[0.145]">
          {results.map((u, i) => {
            const added = addedIds.includes(u.id);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.15) }}
                className="row-hover flex items-center justify-between gap-4 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="avatar-square h-8 w-8 shrink-0 font-mono text-[11px]">
                    {userName(u).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-medium text-white">
                      {userName(u)}
                    </p>
                    <p className="metric truncate text-xs">
                      {u.email} · {u.role}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={added || disabled || pendingId === u.id}
                  onClick={() => void pick(u)}
                  className={
                    added
                      ? "btn-secondary gap-1.5 px-3 py-2 text-xs text-[#62c073]"
                      : "btn-square gap-1.5 px-3 py-2 text-xs"
                  }
                >
                  {added ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Added
                    </>
                  ) : pendingId === u.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> Invite
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
