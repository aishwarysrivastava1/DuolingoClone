"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

function Practice() {
  const skill = Number(useSearchParams().get("skill"));
  const skillId = Number.isInteger(skill) && skill > 0 ? skill : null;
  return <LessonPlayer key={skillId ?? "all"} mode="practice" skillId={skillId} />;
}

export default function PracticePage() {
  return (
    <Suspense>
      <Practice />
    </Suspense>
  );
}
