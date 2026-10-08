import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  /** Tailwind height class for the track. */
  height?: string;
  label?: string;
}

/** Rounded progress bar with Duolingo's glossy highlight stripe. */
export function ProgressBar({ value, max = 1, color = "var(--feather)", className, height = "h-4", label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("relative w-full overflow-hidden rounded-full bg-line", height, className)}
    >
      <div
        className="relative h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%`, background: color }}
      >
        {percent > 6 && <div className="absolute inset-x-2 top-[22%] h-[28%] rounded-full bg-white/30" />}
      </div>
    </div>
  );
}
