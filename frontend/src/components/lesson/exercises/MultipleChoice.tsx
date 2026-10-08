"use client";

import { useState } from "react";
import { useNumberKeys } from "@/hooks/useNumberKeys";
import { cn } from "@/lib/cn";
import { CharacterBubble } from "../CharacterBubble";
import { type ExerciseProps, gradedState } from "./types";

/** Picture cards ("Which one of these is …?") or a list of sentence meanings. */
export function MultipleChoice({ exercise, language, locked, result, onChange }: ExerciseProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const pictures = exercise.options.some((option) => option.image);

  const select = (optionId: number) => {
    if (locked) return;
    setSelected(optionId);
    onChange({ type: "multiple_choice", option_id: optionId });
  };

  useNumberKeys((digit) => {
    const option = exercise.options[digit - 1];
    if (option) select(option.id);
  }, !locked);

  if (pictures) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {exercise.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={locked}
            data-state={gradedState(selected === option.id, result)}
            onClick={() => select(option.id)}
            className="choice flex flex-col items-stretch gap-3 p-3 sm:p-4"
          >
            <span className="flex flex-1 items-center justify-center py-2 text-6xl sm:py-6 sm:text-7xl" aria-hidden>
              {option.image}
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="text-left text-[15px] font-bold sm:text-[17px]">{option.text}</span>
              <span className="key-hint hidden sm:inline-flex">{index + 1}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {exercise.source_text && (
        <CharacterBubble audioText={exercise.audio_text} language={language}>
          {exercise.source_text}
        </CharacterBubble>
      )}
      <div className="flex flex-col gap-3">
        {exercise.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={locked}
            data-state={gradedState(selected === option.id, result)}
            onClick={() => select(option.id)}
            className={cn("choice flex items-center gap-4 p-3 text-left sm:p-4")}
          >
            <span className="key-hint">{index + 1}</span>
            <span className="text-[17px] font-semibold">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
