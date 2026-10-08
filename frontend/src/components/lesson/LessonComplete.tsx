"use client";

import { useEffect, useState } from "react";
import { BoltIcon, ClockIcon, CrownIcon, FlameIcon, TargetIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { StreakWeek } from "@/components/shell/StatsBar";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/context/UserContext";
import { formatDuration } from "@/lib/format";
import type { Completion } from "@/lib/types";
import { Confetti } from "./Confetti";

function ResultCard({ label, color, icon, value }: { label: string; color: string; icon: React.ReactNode; value: string }) {
  return (
    <div className="w-full max-w-[150px] rounded-2xl border-2 p-0.5" style={{ borderColor: color, background: color }}>
      <p className="py-1 text-center text-xs font-extrabold tracking-wider text-white uppercase">{label}</p>
      <div className="flex items-center justify-center gap-2 rounded-[13px] bg-surface py-3 text-xl font-extrabold" style={{ color }}>
        {icon}
        {value}
      </div>
    </div>
  );
}

function accuracyLabel(accuracy: number): string {
  if (accuracy === 100) return "Amazing";
  if (accuracy >= 80) return "Good";
  return "Nice try";
}

function Highlights({ summary }: { summary: Completion }) {
  const items: { icon: React.ReactNode; text: string }[] = [];
  if (summary.skill?.leveled_up) {
    items.push({
      icon: <CrownIcon className="size-6" />,
      text:
        summary.skill.crown_level >= summary.skill.max_crown_level
          ? `${summary.skill.title} is now legendary!`
          : `${summary.skill.title} reached level ${summary.skill.crown_level}!`,
    });
  } else if (summary.skill && summary.mode === "lesson") {
    items.push({
      icon: <CrownIcon className="size-6 opacity-60" />,
      text: `${summary.skill.title}: ${summary.skill.lessons_done}/${summary.skill.lessons_total} lessons to the next crown`,
    });
  }
  if (summary.unlocked_skill) items.push({ icon: "🔓", text: `New skill unlocked: ${summary.unlocked_skill.title}` });
  if (summary.daily_goal.just_completed) items.push({ icon: "🎯", text: `Daily goal complete! ${summary.daily_goal.goal_xp} XP today` });
  if (summary.heart_restored) items.push({ icon: "❤️", text: "You earned back a heart!" });
  if (summary.bonus_xp) items.push({ icon: "✨", text: `+${summary.bonus_xp} XP bonus for a perfect lesson` });
  for (const achievement of summary.new_achievements) {
    items.push({ icon: achievement.icon, text: `Achievement unlocked: ${achievement.title}` });
  }
  if (!items.length) return null;
  return (
    <ul className="flex w-full max-w-md flex-col gap-2">
      {items.map((item) => (
        <li key={item.text} className="animate-pop-in card flex items-center gap-3 px-4 py-3 font-bold">
          <span className="flex size-7 items-center justify-center text-xl">{item.icon}</span>
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function CelebrationLayout({ children, onContinue }: { children: React.ReactNode; onContinue: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.repeat) onContinue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">{children}</main>
      <footer className="relative z-10 border-t-2 border-line">
        <div className="mx-auto flex max-w-[1040px] justify-end px-4 py-6 sm:px-10">
          <Button className="w-full sm:w-48" onClick={onContinue} autoFocus>
            Continue
          </Button>
        </div>
      </footer>
    </div>
  );
}

/** Lesson results, followed by a streak screen when today's streak was extended. */
export function LessonComplete({ summary, onFinish }: { summary: Completion; onFinish: () => void }) {
  const [step, setStep] = useState<"results" | "streak">("results");
  const today = useUser().me?.today ?? "";

  if (step === "streak") {
    return (
      <CelebrationLayout onContinue={onFinish}>
        <FlameIcon className="animate-flicker size-36" />
        <p className="text-7xl font-black text-fox">{summary.streak.count}</p>
        <h1 className="text-3xl font-extrabold text-fox">day streak!</h1>
        <div className="card w-full max-w-sm p-4">
          <StreakWeek week={summary.streak.week} today={today} />
        </div>
        <p className="max-w-sm text-muted">
          {summary.streak.count === 1
            ? "You started a new streak! Practice every day to keep it growing."
            : "You extended your streak! Practice each day so your streak won't reset."}
        </p>
      </CelebrationLayout>
    );
  }

  const title = summary.mode === "practice" ? "Practice complete!" : "Lesson complete!";
  return (
    <CelebrationLayout onContinue={() => (summary.streak.extended ? setStep("streak") : onFinish())}>
      <Confetti />
      <Mascot mood="cheer" className="animate-bob w-36 sm:w-44" />
      <h1 className="text-3xl font-extrabold text-bee sm:text-4xl">{title}</h1>
      <div className="flex w-full max-w-md justify-center gap-3">
        <ResultCard label="Total XP" color="var(--bee)" icon={<BoltIcon className="size-6" />} value={`${summary.xp_earned}`} />
        <ResultCard
          label={accuracyLabel(summary.accuracy)}
          color="var(--feather)"
          icon={<TargetIcon className="size-6" />}
          value={`${summary.accuracy}%`}
        />
        <ResultCard
          label={summary.duration_seconds < 90 ? "Speedy" : "Committed"}
          color="var(--macaw)"
          icon={<ClockIcon className="size-6" />}
          value={formatDuration(summary.duration_seconds)}
        />
      </div>
      <Highlights summary={summary} />
    </CelebrationLayout>
  );
}
