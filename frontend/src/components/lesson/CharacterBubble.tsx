"use client";

import { useEffect } from "react";
import { Mascot } from "@/components/Mascot";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useUser } from "@/context/UserContext";
import { speak } from "@/lib/speech";

interface CharacterBubbleProps {
  children: React.ReactNode;
  audioText?: string | null;
  language: string;
}

/** The owl "saying" the prompt sentence, with a speaker button when audio exists. */
export function CharacterBubble({ children, audioText, language }: CharacterBubbleProps) {
  const soundEnabled = useUser().me?.settings.sound_enabled ?? false;

  // Read the sentence once when the exercise appears, like Duolingo does.
  useEffect(() => {
    if (audioText && soundEnabled) speak(audioText, language);
  }, [audioText, language, soundEnabled]);

  return (
    <div className="flex items-end gap-2 sm:gap-4">
      <Mascot className="w-24 shrink-0 sm:w-32" />
      <div className="relative mb-8 rounded-2xl border-2 border-line px-4 py-3 sm:mb-12">
        <span className="absolute bottom-5 -left-[9px] size-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" />
        <div className="relative flex items-center gap-3">
          {audioText && <SpeakerButton text={audioText} language={language} />}
          <span className="text-lg leading-snug sm:text-xl">{children}</span>
        </div>
      </div>
    </div>
  );
}
