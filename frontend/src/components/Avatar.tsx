import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  color: string;
  /** Overrides the default first letter of `name` (e.g. "AS"). */
  initials?: string;
  className?: string;
}

/** Initial-letter avatar on the learner's colour. */
export function Avatar({ name, color, initials, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white uppercase", className)}
      style={{ background: color }}
    >
      {initials || name.trim().charAt(0) || "?"}
    </span>
  );
}
