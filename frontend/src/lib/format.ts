/** "29:05" for under an hour, otherwise "4h 12m". */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "1:35" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Parse an ISO date (YYYY-MM-DD) as a local calendar date. */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatMonthYear(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function weekdayInitials(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
}
