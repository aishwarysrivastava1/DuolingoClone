"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CharacterBubble } from "../CharacterBubble";
import type { ExerciseProps } from "./types";

const SPECIAL_CHARACTERS: Record<string, string[]> = {
  es: ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"],
};

/** Free-text translation with an accent keyboard for the learning language. */
export function TypeAnswer({ exercise, language, locked, result, onChange }: ExerciseProps) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => input.current?.focus(), []);

  const update = (value: string) => {
    setText(value);
    onChange(value.trim() ? { type: "type_answer", text: value } : null);
  };

  const insert = (character: string) => {
    const field = input.current;
    if (!field || locked) return;
    const start = field.selectionStart ?? text.length;
    const end = field.selectionEnd ?? text.length;
    update(text.slice(0, start) + character + text.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + character.length, start + character.length);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <CharacterBubble language={language}>{exercise.source_text}</CharacterBubble>
      <textarea
        ref={input}
        value={text}
        lang={language}
        disabled={locked}
        placeholder="Type your answer"
        aria-label="Your answer"
        autoCapitalize="off"
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => update(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
        className={cn(
          "min-h-36 w-full resize-none rounded-2xl border-2 bg-surface-2 p-4 text-lg outline-none focus-visible:outline-none",
          !result && "border-line focus:border-macaw",
          result?.correct && "border-feather",
          result && !result.correct && "border-cardinal",
        )}
      />
      {SPECIAL_CHARACTERS[language] && (
        <div className="flex flex-wrap gap-2" aria-label="Special characters">
          {SPECIAL_CHARACTERS[language].map((character) => (
            <button
              key={character}
              type="button"
              disabled={locked}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insert(character)}
              className="choice flex size-11 items-center justify-center text-lg font-bold"
            >
              {character}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
