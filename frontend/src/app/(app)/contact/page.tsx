import type { Metadata } from "next";
import { AuthorCard } from "@/components/contact/AuthorCard";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mascot } from "@/components/Mascot";
import { AUTHOR, AUTHOR_FIRST_NAME } from "@/lib/author";

export const metadata: Metadata = {
  title: `Contact · ${AUTHOR.name}`,
  description: `Get in touch with ${AUTHOR.name}, the developer of this Duolingo clone.`,
};

const TECH_STACK = ["Next.js", "React", "TypeScript", "Tailwind CSS", "FastAPI", "SQLite / Turso"];

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4 rounded-2xl bg-macaw p-5 text-white">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Contact the developer</h1>
          <p className="mt-1 font-semibold opacity-90">
            Questions, feedback or ideas for the app? {AUTHOR_FIRST_NAME} would love to hear from you.
          </p>
        </div>
        <Mascot mood="cheer" className="w-20 shrink-0" />
      </section>

      <AuthorCard />
      <ContactForm />

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="about-project-title">
        <h2 id="about-project-title" className="text-xl font-extrabold">
          About this project
        </h2>
        <p className="text-muted">
          This Duolingo-style language course, with its learning path, lessons, XP, streaks and hearts, was designed and built
          by {AUTHOR.name} as an independent project.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Built with">
          {TECH_STACK.map((tech) => (
            <li key={tech} className="rounded-xl border-2 border-line bg-surface-2 px-3 py-1 text-sm font-extrabold text-muted">
              {tech}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
