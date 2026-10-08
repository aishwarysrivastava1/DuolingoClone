import Link from "next/link";
import { GraduationCapIcon } from "@/components/icons";
import { AUTHOR, authorMailto } from "@/lib/author";
import { cn } from "@/lib/cn";

const LINK = "rounded-md font-extrabold text-muted hover:text-macaw";

function Credit({ className }: { className?: string }) {
  return (
    <p className={cn("font-extrabold", className)}>
      Built by{" "}
      <Link href="/contact" className="rounded-md text-feather-dark hover:underline hover:underline-offset-4 dark:text-feather">
        {AUTHOR.name}
      </Link>
    </p>
  );
}

interface SiteFooterProps {
  /** `compact` is just the "Built by" credit, for pages outside the app shell. */
  variant?: "full" | "compact";
  className?: string;
}

/** Author credit and contact links shown at the end of every app page. */
export function SiteFooter({ variant = "full", className }: SiteFooterProps) {
  if (variant === "compact") {
    return (
      <footer className={cn("text-center", className)}>
        <Credit className="text-sm text-muted" />
      </footer>
    );
  }

  return (
    <footer className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <Credit className="text-[17px]" />
      <p className="text-sm font-bold text-muted">
        <GraduationCapIcon className="mr-1.5 inline size-5 align-[-5px] text-macaw" />
        {AUTHOR.university}
      </p>
      <nav aria-label="Contact" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
        <Link href="/contact" className={LINK}>
          Contact
        </Link>
        <span aria-hidden className="text-faint">
          ·
        </span>
        <a href={authorMailto()} className={cn(LINK, "break-all")}>
          {AUTHOR.email}
        </a>
      </nav>
      <div className="text-xs font-semibold text-muted">
        <p>
          © {new Date().getFullYear()} {AUTHOR.name}
        </p>
        <p className="mt-0.5">An independent project, not affiliated with Duolingo.</p>
      </div>
    </footer>
  );
}
