"use client";

import { useState } from "react";
import { MailIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { AUTHOR_FIRST_NAME, DEFAULT_CONTACT_SUBJECT, authorMailto } from "@/lib/author";
import { cn } from "@/lib/cn";

const NAME_MAX = 60;
const SUBJECT_MAX = 120;
const MESSAGE_MAX = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT =
  "w-full rounded-2xl border-2 bg-surface-2 px-4 font-bold outline-none placeholder:font-semibold focus:border-macaw focus-visible:outline-none";

function Label({ htmlFor, optional, children }: { htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-extrabold">
      {children}
      {optional && <span className="ml-1.5 text-sm font-bold text-muted">(optional)</span>}
    </label>
  );
}

/** Composes an email to the author in the visitor's own mail app (the site has no mail server). */
export function ContactForm() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const sender = name.trim();
  const replyTo = email.trim();
  const emailValid = replyTo === "" || EMAIL_PATTERN.test(replyTo);
  const showEmailError = emailTouched && !emailValid;
  const canSend = sender !== "" && message.trim() !== "" && emailValid;

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;
    const signature = [`Name: ${sender}`, replyTo && `Email: ${replyTo}`].filter(Boolean).join("\n");
    // RFC 6068 asks for CRLF line breaks in a mailto body.
    const body = `${message.trim()}\n\n—\n${signature}`.replace(/\r?\n/g, "\r\n");
    toast("Opening your email app…", { icon: "✉️" });
    window.location.href = authorMailto({ subject: subject.trim() || DEFAULT_CONTACT_SUBJECT, body });
  };

  return (
    <section className="card flex flex-col gap-1 p-5" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="text-xl font-extrabold">
        Send a message
      </h2>
      <p className="text-muted">
        Write to {AUTHOR_FIRST_NAME} here and your email app opens with the message ready to send. Nothing is sent from this
        site.
      </p>

      <form onSubmit={send} className="mt-4 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="contact-name">Your name</Label>
            <input
              id="contact-name"
              name="name"
              required
              autoComplete="name"
              maxLength={NAME_MAX}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={cn(INPUT, "min-h-12 border-line")}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="contact-email" optional>
              Your email
            </Label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={showEmailError || undefined}
              aria-describedby={showEmailError ? "contact-email-error" : undefined}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={cn(INPUT, "min-h-12", showEmailError ? "border-cardinal" : "border-line")}
            />
            {showEmailError && (
              <p id="contact-email-error" className="text-sm font-bold text-wrong-ink">
                Enter a valid email address, or leave it blank.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-subject" optional>
            Subject
          </Label>
          <input
            id="contact-subject"
            name="subject"
            maxLength={SUBJECT_MAX}
            placeholder={DEFAULT_CONTACT_SUBJECT}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={cn(INPUT, "min-h-12 border-line")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="contact-message">Message</Label>
            <span id="contact-message-count" className="text-sm font-bold text-muted">
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            maxLength={MESSAGE_MAX}
            placeholder="Feedback, a bug you spotted, or just hello"
            aria-describedby="contact-message-count"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className={cn(INPUT, "min-h-36 resize-y border-line py-3 leading-relaxed")}
          />
        </div>

        <Button type="submit" disabled={!canSend} className="sm:self-end sm:px-8">
          <MailIcon className="size-6" />
          Send message
        </Button>
      </form>
    </section>
  );
}
