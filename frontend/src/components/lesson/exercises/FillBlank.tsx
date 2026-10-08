"use client";

import { useState } from "react";
import { useNumberKeys } from "@/hooks/useNumberKeys";
import { cn } from "@/lib/cn";
import { CharacterBubble } from "../CharacterBubble";
import { type ExerciseProps, gradedState } from "./types";

/** A sentence with one gap and a few candidate words. */
export function FillBlank({ exercise, language, locked, result, onChange }: ExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [before, after] = (exercise.source_text ?? "___").split("___");
  const chosen = exercise.options.find((option) => option.id === selected);

  const select = (optionId: number) => {
    if (locked) return;
    setSelected(optionId);
    onChange({ type: "fill_blank", option_id: optionId });
  };

  useNumberKeys((digit) => {
    const option = exercise.options[digit - 1];
    if (option) select(option.id);
  }, !locked);

  return (
    <div className="flex flex-col gap-8">
      <CharacterBubble language={language}>
        <span className="block">
          {before}
          <span
            className={cn(
              "mx-1 inline-block min-w-20 border-b-2 border-ink px-1 text-center font-bold",
              !result && "text-selected-ink",
              result?.correct && "text-correct-ink",
              result && !result.correct && "text-wrong-ink",
            )}
          >
            {chosen?.text ?? " "}
          </span>
          {after}
        </span>
        {exercise.translation && <span className="mt-1 block text-base text-muted">{exercise.translation}</span>}
      </CharacterBubble>
      <div className="flex flex-wrap justify-center gap-3">
        {exercise.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={locked}
            data-state={gradedState(selected === option.id, result)}
            onClick={() => select(option.id)}
            className="choice flex h-14 items-center gap-3 px-4 text-[17px] font-semibold"
          >
            <span className="key-hint hidden sm:inline-flex">{index + 1}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
