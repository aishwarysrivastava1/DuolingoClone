"use client";

import { Avatar } from "@/components/Avatar";
import { GraduationCapIcon, MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { AUTHOR, AUTHOR_INITIALS, DEFAULT_CONTACT_SUBJECT, authorMailto } from "@/lib/author";

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 border-t-2 border-line py-4 sm:gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-selected-bg text-selected-ink sm:size-11">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold tracking-wider text-muted uppercase">{label}</p>
        {children}
      </div>
    </li>
  );
}

/** Who built the app, with one-tap ways to get in touch. */
export function AuthorCard() {
  const toast = useToast();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(AUTHOR.email);
      toast("Email address copied", { tone: "success", icon: "📋" });
    } catch {
      // Clipboard access needs a secure context and permission; it can be refused.
      toast("Couldn't copy the address. Please copy it by hand.", { tone: "error" });
    }
  };

  return (
    <section className="card flex flex-col p-5" aria-labelledby="author-name">
      <div className="flex items-center gap-4 pb-5">
        <Avatar
          name={AUTHOR.name}
          initials={AUTHOR_INITIALS}
          color="var(--feather)"
          className="size-20 text-3xl shadow-[0_5px_0_var(--feather-dark)]"
        />
        <div className="min-w-0">
          <h2 id="author-name" className="text-2xl leading-tight font-extrabold">
            {AUTHOR.name}
          </h2>
          <p className="mt-1 text-muted">Developer of this Duolingo clone</p>
        </div>
      </div>

      <ul>
        <DetailRow icon={<GraduationCapIcon className="size-6" />} label="University">
          <p className="font-bold">{AUTHOR.university}</p>
        </DetailRow>
        <DetailRow icon={<MailIcon className="size-6" />} label="Email">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <a
              href={authorMailto()}
              className="min-w-0 rounded-md text-[15px] font-bold break-all underline decoration-macaw decoration-2 underline-offset-4 hover:text-macaw sm:text-base"
            >
              {AUTHOR.email}
            </a>
            <Button
              variant="outline"
              onClick={() => void copyEmail()}
              aria-label="Copy email address"
              className="min-h-10 px-4 text-[13px]"
            >
              Copy
            </Button>
          </div>
        </DetailRow>
      </ul>

      <a href={authorMailto({ subject: DEFAULT_CONTACT_SUBJECT })} className="btn btn-primary mt-2">
        <MailIcon className="size-6" />
        Send an email
      </a>
    </section>
  );
}
