"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { canSpeak, speak } from "@/lib/speech";

/** Reads `text` aloud with the browser's text-to-speech (hidden when unsupported). */
export function SpeakerButton({ text, language, small = false }: { text: string; language: string; small?: boolean }) {
  const [supported, setSupported] = useState(false);
  useEffect(() => setSupported(canSpeak()), []);
  if (!supported) return null;
  return (
    <button
      type="button"
      aria-label={`Listen: ${text}`}
      onClick={(event) => {
        event.stopPropagation();
        speak(text, language);
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-macaw text-white shadow-[0_3px_0_var(--macaw-dark)] active:translate-y-[3px] active:shadow-none",
        small ? "size-9" : "size-10",
      )}
    >
      <SpeakerIcon className="size-6" />
    </button>
  );
}
