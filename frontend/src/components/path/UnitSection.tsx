"use client";

import { BookIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { unitStyle } from "@/lib/themes";
import type { Unit } from "@/lib/types";
import { SkillNode, TrophyNode, nodeOffset } from "./SkillNode";

interface UnitSectionProps {
  unit: Unit;
  currentSkillId: number | null;
  currentNodeRef: React.Ref<HTMLDivElement>;
  openSkillId: number | null;
  onToggleSkill: (skillId: number) => void;
  onCloseSkill: () => void;
  onStart: (skillId: number, mode: "lesson" | "practice") => void;
  onOpenGuidebook: (unit: Unit) => void;
}

export function UnitSection({
  unit,
  currentSkillId,
  currentNodeRef,
  openSkillId,
  onToggleSkill,
  onCloseSkill,
  onStart,
  onOpenGuidebook,
}: UnitSectionProps) {
  const flip = unit.position % 2 === 0;
  return (
    <section style={unitStyle(unit.theme)} aria-labelledby={`unit-${unit.id}`}>
      <div className="sticky top-[62px] z-20 bg-bg pt-2 pb-2 xl:top-0 xl:pt-6">
        <header className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-white sm:px-5 sm:py-4" style={{ background: "var(--unit)" }}>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold tracking-wider uppercase opacity-80">Section 1, Unit {unit.position}</p>
            <h2 id={`unit-${unit.id}`} className="text-xl leading-tight font-extrabold sm:text-[22px]">
              {unit.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenGuidebook(unit)}
            className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-black/15 px-3 py-2.5 text-sm font-extrabold tracking-wider uppercase shadow-[0_4px_0_rgb(0_0_0/0.15)] hover:bg-black/10 active:translate-y-1 active:shadow-none"
          >
            <BookIcon className="size-6" />
            <span className="hidden sm:inline">Guidebook</span>
          </button>
        </header>
      </div>

      <div className="relative flex flex-col items-center gap-4 pt-14 pb-4">
        <div className="pointer-events-none absolute top-36 w-24 sm:w-28" style={flip ? { right: "6%" } : { left: "6%" }}>
          <Mascot mood={unit.completed ? "cheer" : "happy"} className="w-full" />
        </div>
        {unit.skills.map((skill, index) => (
          <SkillNode
            key={skill.id}
            ref={skill.id === currentSkillId ? currentNodeRef : undefined}
            skill={skill}
            offset={nodeOffset(index, flip)}
            isCurrent={skill.id === currentSkillId}
            open={openSkillId === skill.id}
            onToggle={() => onToggleSkill(skill.id)}
            onClose={onCloseSkill}
            onStart={(mode) => onStart(skill.id, mode)}
          />
        ))}
        <TrophyNode completed={unit.completed} offset={nodeOffset(unit.skills.length, flip)} />
      </div>
    </section>
  );
}
