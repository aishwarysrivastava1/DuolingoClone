"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OutOfHeartsModal } from "@/components/OutOfHeartsModal";
import { GuidebookModal } from "@/components/path/GuidebookModal";
import { UnitSection } from "@/components/path/UnitSection";
import { ErrorState, LoadingScreen } from "@/components/ui/StatusScreens";
import { useUser } from "@/context/UserContext";
import { useApiResource } from "@/hooks/useApiResource";
import { api } from "@/lib/api";
import type { Unit } from "@/lib/types";

export default function LearnPage() {
  const router = useRouter();
  const { me } = useUser();
  const { data: path, error, reload } = useApiResource("path", api.path);
  const [openSkillId, setOpenSkillId] = useState<number | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<Unit | null>(null);
  const [heartsModalOpen, setHeartsModalOpen] = useState(false);
  const currentNode = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);

  const currentSkillId =
    path?.units.flatMap((unit) => unit.skills).find((skill) => skill.state === "active")?.id ?? null;

  // Like Duolingo, land on the learner's current node.
  useEffect(() => {
    if (!path || scrolled.current) return;
    scrolled.current = true;
    currentNode.current?.scrollIntoView({ block: "center" });
  }, [path]);

  const closeSkill = useCallback(() => setOpenSkillId(null), []);

  const start = (skillId: number, mode: "lesson" | "practice") => {
    if (mode === "lesson" && me && me.hearts.count === 0) {
      setOpenSkillId(null);
      setHeartsModalOpen(true);
      return;
    }
    router.push(mode === "lesson" ? `/lesson/${skillId}` : `/practice?skill=${skillId}`);
  };

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!path || !me) return <LoadingScreen />;

  return (
    <div className="flex flex-col gap-8">
      {path.units.map((unit) => (
        <UnitSection
          key={unit.id}
          unit={unit}
          currentSkillId={currentSkillId}
          currentNodeRef={currentNode}
          openSkillId={openSkillId}
          onToggleSkill={(skillId) => setOpenSkillId((open) => (open === skillId ? null : skillId))}
          onCloseSkill={closeSkill}
          onStart={start}
          onOpenGuidebook={setGuidebookUnit}
        />
      ))}

      {guidebookUnit && (
        <GuidebookModal
          unit={guidebookUnit}
          language={path.course.learning_language}
          onClose={() => setGuidebookUnit(null)}
        />
      )}
      <OutOfHeartsModal
        open={heartsModalOpen}
        me={me}
        onRefilled={() => setHeartsModalOpen(false)}
        onPractice={() => router.push("/practice")}
        onDismiss={() => setHeartsModalOpen(false)}
      />
    </div>
  );
}
