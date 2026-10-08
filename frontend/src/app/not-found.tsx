import { Mascot } from "@/components/Mascot";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Mascot mood="sad" className="w-32" />
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="max-w-sm text-muted">We looked everywhere, but this page flew away.</p>
      <ButtonLink href="/learn" variant="secondary" className="w-56">
        Back to learning
      </ButtonLink>
      <SiteFooter variant="compact" className="mt-8" />
    </div>
  );
}
