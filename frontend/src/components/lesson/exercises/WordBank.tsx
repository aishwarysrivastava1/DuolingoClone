"use client";

import { useEffect, useState } from "react";
import { CharacterBubble } from "../CharacterBubble";
import type { ExerciseProps } from "./types";

const TILE = "choice flex h-12 items-center px-3 text-[17px] sm:px-4";

/** Translate by tapping word tiles into the answer lines. */
export function WordBank({ exercise, language, locked, onChange }: ExerciseProps) {
  const [picked, setPicked] = useState<number[]>([]);
  const byId = new Map(exercise.options.map((option) => [option.id, option]));

  const update = (next: number[]) => {
    setPicked(next);
    onChange(next.length ? { type: "translate", option_ids: next } : null);
  };

  // Backspace removes the last tile, like Duolingo's keyboard support.
  useEffect(() => {
    if (locked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Backspace" && picked.length) update(picked.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-6">
      {exercise.source_text && (
        <CharacterBubble audioText={exercise.audio_text} language={language}>
          {exercise.source_text}
        </CharacterBubble>
      )}

      <div
        aria-label="Your answer"
        className="flex min-h-[120px] flex-wrap content-start gap-x-2 gap-y-3 pt-1.5"
        style={{
          backgroundImage: "linear-gradient(to bottom, transparent 58px, var(--line) 58px, var(--line) 60px)",
          backgroundSize: "100% 60px",
        }}
      >
        {picked.map((optionId) => (
          <button
            key={optionId}
            type="button"
            disabled={locked}
            onClick={() => update(picked.filter((id) => id !== optionId))}
            className={TILE}
          >
            {byId.get(optionId)?.text}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2" aria-label="Word bank">
        {exercise.options.map((option) =>
          picked.includes(option.id) ? (
            <span key={option.id} className={TILE} data-state="placeholder" aria-hidden>
              {option.text}
            </span>
          ) : (
            <button
              key={option.id}
              type="button"
              disabled={locked}
              onClick={() => update([...picked, option.id])}
              className={TILE}
            >
              {option.text}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
