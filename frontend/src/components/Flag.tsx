import { cn } from "@/lib/cn";

/** Course flag. Only Spanish is seeded; other codes fall back to a neutral flag. */
export function CourseFlag({ language, className }: { language: string; className?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={cn("shrink-0", className)} aria-label={`${language} flag`} role="img">
      <defs>
        <clipPath id={`flag-${language}`}>
          <rect width="32" height="24" rx="5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#flag-${language})`}>
        {language === "es" ? (
          <>
            <rect width="32" height="24" fill="#ff4b4b" />
            <rect y="6" width="32" height="12" fill="#ffc800" />
            <rect x="7" y="9" width="4" height="6" rx="1" fill="#e58600" />
          </>
        ) : (
          <rect width="32" height="24" fill="var(--macaw)" />
        )}
      </g>
      <rect x="1" y="1" width="30" height="22" rx="4" fill="none" stroke="rgb(0 0 0 / 0.12)" strokeWidth="2" />
    </svg>
  );
}
