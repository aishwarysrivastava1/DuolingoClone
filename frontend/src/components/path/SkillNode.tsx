"use client";

import { type CSSProperties, forwardRef, useEffect, useRef } from "react";
import { CheckIcon, CrownIcon, DumbbellIcon, LockIcon, StarIcon, TrophyIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Skill } from "@/lib/types";
import { ProgressRing } from "./ProgressRing";

/** Horizontal offsets that make the path snake left and right. */
const OFFSETS = [0, 44, 70, 44, 0, -44, -70, -44];

export function nodeOffset(index: number, flip: boolean): number {
  const offset = OFFSETS[index % OFFSETS.length];
  return flip ? -offset : offset;
}

interface SkillNodeProps {
  skill: Skill;
  offset: number;
  isCurrent: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onStart: (mode: "lesson" | "practice") => void;
}

export const SkillNode = forwardRef<HTMLDivElement, SkillNodeProps>(function SkillNode(
  { skill, offset, isCurrent, open, onToggle, onClose, onStart },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const locked = skill.state === "locked";
  const legendary = skill.crown_level >= skill.max_crown_level;
  const showRing = !locked && !legendary && (isCurrent || skill.lessons_done > 0);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const Icon = locked ? LockIcon : legendary ? TrophyIcon : skill.crown_level > 0 ? CheckIcon : StarIcon;
  const face = locked ? "var(--locked)" : legendary ? "var(--bee)" : "var(--unit)";
  const shadow = locked ? "var(--locked-dark)" : legendary ? "var(--bee-dark)" : "var(--unit-dark)";

  return (
    <div
      ref={ref}
      className={cn("relative", isCurrent && "mt-8", open && "z-30")}
      style={{ transform: `translateX(${offset}px)` }}
    >
      <div ref={root} className="relative flex size-[102px] items-center justify-center">
        {isCurrent && !open && (
          <div className="animate-bob pointer-events-none absolute -top-11 z-10 rounded-xl border-2 border-line bg-surface px-3 py-2 text-[15px] font-extrabold tracking-wider whitespace-nowrap text-[var(--unit)] uppercase">
            Start
            <span className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-line bg-surface" />
          </div>
        )}
        {showRing && <ProgressRing progress={skill.lessons_done / skill.lessons_total} />}
        <div className="relative -mt-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${skill.title} — ${locked ? "locked" : `level ${skill.crown_level}`}`}
          className="path-node relative flex h-[62px] w-[70px] items-center justify-center rounded-[50%]"
          style={{ "--node-face": face, "--node-shadow": shadow } as CSSProperties}
        >
          <Icon className={cn("size-8", locked ? "text-faint" : "text-white")} />
        </button>
        {skill.crown_level > 0 && !legendary && (
          <span className="pointer-events-none absolute -right-4 -bottom-4 flex items-center justify-center" aria-hidden>
            <CrownIcon className="size-10 drop-shadow-[0_2px_0_rgb(0_0_0/0.15)]" />
            <span className="absolute top-[13px] text-xs font-black text-[#a56a00]">{skill.crown_level}</span>
          </span>
        )}
        </div>

        {open && (
          <SkillPopover skill={skill} offset={offset} locked={locked} legendary={legendary} onStart={onStart} />
        )}
      </div>
    </div>
  );
});

function SkillPopover({
  skill,
  offset,
  locked,
  legendary,
  onStart,
}: {
  skill: Skill;
  offset: number;
  locked: boolean;
  legendary: boolean;
  onStart: (mode: "lesson" | "practice") => void;
}) {
  // Center the card on the column while the arrow keeps pointing at the node.
  const style = { left: `calc(50% - ${offset}px)` };
  const arrow = { left: `calc(50% + ${offset}px)` };
  const nextLesson = skill.lessons_done + 1;

  return (
    <div
      role="dialog"
      aria-label={skill.title}
      className={cn(
        "animate-pop-in absolute top-full z-30 mt-2 w-[min(300px,calc(100vw-2.5rem))] -translate-x-1/2 rounded-2xl p-4",
        locked ? "border-2 border-line bg-surface-2" : "text-white",
      )}
      style={{ ...style, background: locked ? undefined : legendary ? "var(--bee)" : "var(--unit)" }}
    >
      <span
        className={cn("absolute -top-2 size-4 -translate-x-1/2 rotate-45", locked && "border-t-2 border-l-2 border-line")}
        style={{ ...arrow, background: locked ? "var(--surface-2)" : legendary ? "var(--bee)" : "var(--unit)" }}
      />
      <h3 className={cn("relative text-lg font-extrabold", locked && "text-faint")}>{skill.title}</h3>
      {locked ? (
        <>
          <p className="mt-1 mb-4 text-faint">Complete all levels above to unlock this!</p>
          <Button variant="muted" disabled className="w-full">
            Locked
          </Button>
        </>
      ) : legendary ? (
        <>
          <p className="mt-1 mb-4 font-semibold opacity-90">Legendary! You&apos;ve mastered this skill.</p>
          <Button variant="white" className="w-full" onClick={() => onStart("practice")}>
            <DumbbellIcon className="size-5" /> Practice +5 XP
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 mb-4 font-semibold opacity-90">
            {skill.crown_level > 0 ? `Level ${skill.crown_level + 1} · ` : ""}Lesson {nextLesson} of {skill.lessons_total}
          </p>
          <Button variant="white" className="w-full" onClick={() => onStart("lesson")}>
            Start +10 XP
          </Button>
          {skill.crown_level > 0 && (
            <button
              type="button"
              onClick={() => onStart("practice")}
              className="mt-3 w-full rounded-xl py-2 text-sm font-extrabold tracking-wider uppercase hover:bg-black/10"
            >
              Practice +5 XP
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function TrophyNode({ completed, offset }: { completed: boolean; offset: number }) {
  return (
    <div className="flex size-[102px] items-center justify-center" style={{ transform: `translateX(${offset}px)` }}>
      <div
        title={completed ? "Unit complete!" : "Complete every skill to finish this unit"}
        className="path-node pointer-events-none -mt-2 flex h-[62px] w-[70px] items-center justify-center rounded-[50%]"
        style={
          {
            "--node-face": completed ? "var(--bee)" : "var(--locked)",
            "--node-shadow": completed ? "var(--bee-dark)" : "var(--locked-dark)",
          } as CSSProperties
        }
      >
        <TrophyIcon className={cn("size-9", completed ? "text-white" : "text-faint")} />
      </div>
    </div>
  );
}
