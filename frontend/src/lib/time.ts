/** Formatting helpers shared by the scheduler, session page and interview room. */

export function formatDateTime(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "unscheduled";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Remaining time until `target`, split for display. `diff` is negative once the
 * moment has passed, which is how callers detect "already started".
 */
export function countdownParts(target: string | Date, now = Date.now()) {
  const diff = new Date(target).getTime() - now;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  return { diff, days, hours, minutes, seconds, isPast: diff <= 0 };
}

export function formatCountdown(target: string | Date, now = Date.now()) {
  const { days, hours, minutes, seconds, isPast } = countdownParts(target, now);
  if (isPast) return "ready to start";
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}
