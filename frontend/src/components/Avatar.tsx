import { cn } from "@/lib/cn";

/** Initial-letter avatar on the learner's colour. */
export function Avatar({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white uppercase", className)}
      style={{ background: color }}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
