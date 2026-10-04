"use client";

import { AlertTriangle, BellRing, Link2, Mail, MailWarning } from "lucide-react";
import type { InviteResult } from "@/lib/type";

/**
 * Renders what actually happened to each invitation. Two channels exist and
 * they can diverge: the in-app notification is always written, the email only
 * goes out when SMTP is configured. Showing "invite sent" when the email was
 * skipped is what made this flow feel broken, so each channel is reported.
 */
export default function InviteStatusList({
  invites,
  joinUrl,
  className = "",
}: {
  invites: InviteResult[];
  /** Room link to copy — the invitation email points here too. */
  joinUrl?: string;
  className?: string;
}) {
  if (!invites.length) return null;

  const emailed = invites.filter((i) => i.emailDelivered).length;
  const anyMailMissed = invites.some((i) => !i.emailDelivered);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.145] pb-3">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#999999]">
          Invitations ({invites.length})
        </h4>
        <span className="chip chip-active font-mono">
          <BellRing className="h-3 w-3" /> in-app {invites.filter((i) => i.notifiedInApp).length}
          /{invites.length}
        </span>
        <span
          className={`chip font-mono ${emailed === invites.length ? "chip-success" : "chip-warn"}`}
        >
          {anyMailMissed ? <MailWarning className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
          email {emailed}/{invites.length}
        </span>
      </div>

      <div className="mt-3 divide-y divide-white/[0.145] border border-white/[0.145]">
        {invites.map((inv) => (
          <div key={inv.userId} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-medium text-white">
                {inv.displayName}
              </p>
              <p className="metric truncate font-mono text-[11px]">
                {inv.email} · {inv.role}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {inv.notifiedInApp ? (
                  <span className="chip chip-success font-mono">
                    <BellRing className="h-3 w-3" /> in-app notice sent
                  </span>
                ) : (
                  <span className="chip chip-danger font-mono">in-app notice failed</span>
                )}
                {inv.emailDelivered ? (
                  <span className="chip chip-success font-mono">
                    <Mail className="h-3 w-3" /> emailed
                  </span>
                ) : (
                  <span className="chip chip-warn font-mono" title={inv.emailReason}>
                    <MailWarning className="h-3 w-3" />
                    {inv.emailReason === "smtp_not_configured"
                      ? "email not sent — SMTP not configured"
                      : `email not sent — ${inv.emailReason ?? "unknown error"}`}
                  </span>
                )}
              </div>
            </div>
            {inv.joinUrl && (
              <a
                href={inv.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary shrink-0 gap-1.5 px-3 py-2 text-xs"
              >
                <Link2 className="h-3.5 w-3.5" /> Open room link
              </a>
            )}
          </div>
        ))}
      </div>

      {anyMailMissed && (
        <p className="metric mt-3 flex items-start gap-2 text-[11px]">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-[#f5b544]" />
          The candidate can still see the invitation in their in-app notifications,
          but no email left the server. Set SMTP_HOST / SMTP_USER / SMTP_PASS in
          backend/.env to enable email delivery.
        </p>
      )}

      {joinUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="metric text-[11px]">Shareable room link</span>
          <code className="min-w-0 flex-1 truncate border border-white/[0.145] bg-black px-2.5 py-1.5 font-mono text-[11px] text-[#52a8ff]">
            {joinUrl}
          </code>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(joinUrl)}
            className="btn-secondary gap-1.5 px-3 py-2 text-xs"
          >
            <Link2 className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      )}
    </div>
  );
}
