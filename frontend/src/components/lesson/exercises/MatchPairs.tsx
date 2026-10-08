"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useSound } from "@/hooks/useSound";
import { useNumberKeys } from "@/hooks/useNumberKeys";
import { cn } from "@/lib/cn";
import { speak } from "@/lib/speech";
import type { ExerciseOption } from "@/lib/types";
import type { ExerciseProps } from "./types";

type Side = "left" | "right";

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Tap a word on each side to pair them. Mismatches shake but cost no hearts
 * (as on Duolingo); the exercise submits itself once every pair is found.
 */
export function MatchPairs({ exercise, language, locked, onSubmit }: ExerciseProps) {
  const sound = useSound();
  const soundEnabled = useUser().me?.settings.sound_enabled ?? false;
  const [right] = useState(() => shuffled(exercise.options));
  const [selected, setSelected] = useState<{ side: Side; id: number } | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [flash, setFlash] = useState<{ left: number; right: number; ok: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pick = (side: Side, option: ExerciseOption) => {
    if (locked || flash || matched.includes(option.id)) return;
    if (side === "left" && soundEnabled) speak(option.text, language);
    if (!selected || selected.side === side) {
      setSelected(selected?.side === side && selected.id === option.id ? null : { side, id: option.id });
      return;
    }
    const leftId = side === "left" ? option.id : selected.id;
    const rightId = side === "right" ? option.id : selected.id;
    const ok = leftId === rightId;
    setSelected(null);
    setFlash({ left: leftId, right: rightId, ok });
    if (!ok) sound.wrong();
    timer.current = window.setTimeout(
      () => {
        setFlash(null);
        if (!ok) return;
        const next = [...matched, leftId];
        setMatched(next);
        if (next.length === exercise.options.length) {
          onSubmit({ type: "match_pairs", pairs: next.map((id) => [id, id] as [number, number]) });
        }
      },
      ok ? 300 : 600,
    );
  };

  // Keys 1-5 pick the left column, 6-9 and 0 the right column.
  useNumberKeys((digit) => {
    const index = digit === 0 ? 9 : digit - 1;
    const count = exercise.options.length;
    if (index < count) pick("left", exercise.options[index]);
    else if (index - count < count) pick("right", right[index - count]);
  }, !locked);

  const stateOf = (side: Side, id: number) => {
    if (matched.includes(id)) return "done";
    if (flash && flash[side] === id) return flash.ok ? "correct" : "wrong";
    if (selected?.side === side && selected.id === id) return "selected";
    return undefined;
  };

  const column = (side: Side, options: ExerciseOption[], offset: number) => (
    <div className="flex flex-col gap-3">
      {options.map((option, index) => {
        const state = stateOf(side, option.id);
        return (
          <button
            key={option.id}
            type="button"
            disabled={locked || state === "done"}
            data-state={state}
            onClick={() => pick(side, option)}
            className={cn("choice flex min-h-14 items-center gap-3 px-3 py-2 text-left", state === "wrong" && "animate-shake")}
          >
            <span className="key-hint hidden sm:inline-flex">{(offset + index + 1) % 10}</span>
            <span className="flex-1 text-center text-[17px] font-semibold">{side === "left" ? option.text : option.match_text}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6">
      {column("left", exercise.options, 0)}
      {column("right", right, exercise.options.length)}
    </div>
  );
}
