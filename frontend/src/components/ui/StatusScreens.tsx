"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { Button } from "./Button";

interface LoadingScreenProps {
  label?: string;
  /** After this long, explain that the (free-tier) server may be waking up. */
  slowHintAfterMs?: number;
}

export function LoadingScreen({ label = "Loading...", slowHintAfterMs }: LoadingScreenProps) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!slowHintAfterMs) return;
    const timer = window.setTimeout(() => setSlow(true), slowHintAfterMs);
    return () => window.clearTimeout(timer);
  }, [slowHintAfterMs]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24" role="status">
      <Mascot className="animate-bob w-24" />
      <p className="text-sm font-extrabold tracking-[0.2em] text-faint uppercase">{label}</p>
      {slow && (
        <p className="animate-fade-in max-w-xs px-6 text-center text-sm text-muted">
          Waking up the server… It sleeps when nobody is using it, so the first visit can take up to a minute.
        </p>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <Mascot mood="sad" className="w-28" />
      <h2 className="text-2xl font-extrabold">Oh no! Something went wrong.</h2>
      <p className="max-w-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="w-48">
          Try again
        </Button>
      )}
    </div>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="rounded-lg bg-surface-2 px-2 py-1 text-xs font-extrabold tracking-wider whitespace-nowrap text-faint uppercase">
      Coming soon
    </span>
  );
}
