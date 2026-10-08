"use client";

import { useParams } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { ErrorState } from "@/components/ui/StatusScreens";

export default function LessonPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const id = Number(skillId);
  if (!Number.isInteger(id) || id <= 0) {
    return <ErrorState message="That lesson doesn't exist." />;
  }
  return <LessonPlayer key={id} mode="lesson" skillId={id} />;
}
