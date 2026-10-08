"use client";

import Link from "next/link";
import { CourseFlag } from "@/components/Flag";
import { BoltIcon, CheckIcon, FlameIcon, GemIcon, HeartIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ComingSoonBadge } from "@/components/ui/StatusScreens";
import { useUser } from "@/context/UserContext";
import { useHeartRefill } from "@/hooks/useHeartRefill";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/cn";
import { formatCountdown, weekdayInitials } from "@/lib/format";
import type { Me } from "@/lib/types";
import { HoverPopover } from "./Popover";

/** Flag, streak, gems, hearts and XP — each with its own Duolingo-style dropdown. */
export function StatsBar({ className }: { className?: string }) {
  const { me } = useUser();
  if (!me) return <div className={cn("h-11", className)} />;
  const hasHearts = me.hearts.count > 0;
  return (
    <div className={cn("flex items-center justify-between gap-1", className)}>
      <HoverPopover label="Your courses" align="left" trigger={<CourseFlag language={me.course.learning_language} className="h-7 w-9" />}>
        {() => <CoursePanel me={me} />}
      </HoverPopover>
      <HoverPopover
        label={`${me.streak.count} day streak`}
        trigger={
          <>
            <FlameIcon active={me.streak.active_today} className="size-7" />
            <span className={me.streak.active_today ? "text-fox" : "text-faint"}>{me.streak.count}</span>
          </>
        }
      >
        {() => <StreakPanel me={me} />}
      </HoverPopover>
      <HoverPopover
        label={`${me.gems} gems`}
        trigger={
          <>
            <GemIcon className="size-7" />
            <span className="text-macaw">{me.gems}</span>
          </>
        }
      >
        {() => <GemsPanel me={me} />}
      </HoverPopover>
      <HoverPopover
        label={`${me.hearts.count} hearts`}
        trigger={
          <>
            <HeartIcon empty={!hasHearts} className="size-7" />
            <span className={hasHearts ? "text-cardinal" : "text-faint"}>{me.hearts.count}</span>
          </>
        }
      >
        {(close) => <HeartsPanel me={me} onNavigate={close} />}
      </HoverPopover>
      <HoverPopover
        label={`${me.total_xp} XP`}
        align="right"
        trigger={
          <>
            <BoltIcon className="size-7" />
            <span className="text-bee">{me.total_xp}</span>
          </>
        }
      >
        {() => <XpPanel me={me} />}
      </HoverPopover>
    </div>
  );
}

function CoursePanel({ me }: { me: Me }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-extrabold tracking-wider text-faint uppercase">My courses</h3>
      <div className="flex items-center gap-3 rounded-xl bg-selected-bg p-3">
        <CourseFlag language={me.course.learning_language} className="h-8 w-10" />
        <span className="flex-1 font-extrabold text-selected-ink">{me.course.title}</span>
        <CheckIcon className="size-5 text-selected-ink" />
      </div>
      <div className="flex items-center justify-between gap-3 px-1 text-muted">
        <span className="font-bold">Add a new course</span>
        <ComingSoonBadge />
      </div>
    </div>
  );
}

export function StreakWeek({ week, today }: { week: Me["streak"]["week"]; today: string }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {week.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-1.5">
          <span className={cn("text-xs font-extrabold", day.date === today ? "text-fox" : "text-faint")}>
            {weekdayInitials(day.date)}
          </span>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              day.active ? "bg-fox text-white" : "bg-line",
              day.date === today && !day.active && "ring-2 ring-fox ring-offset-2 ring-offset-[var(--surface)]",
            )}
          >
            {day.active && <CheckIcon className="size-4" />}
          </span>
        </div>
      ))}
    </div>
  );
}

function StreakPanel({ me }: { me: Me }) {
  const { count, active_today, longest } = me.streak;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <FlameIcon active={active_today} className="size-12" />
        <div>
          <h3 className="text-xl font-extrabold">{count} day streak</h3>
          <p className="text-sm text-muted">
            {active_today ? "You extended your streak today!" : "Do a lesson today to extend your streak!"}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border-2 border-line p-3">
        <StreakWeek week={me.streak.week} today={me.today} />
      </div>
      <p className="text-sm font-bold text-faint">Longest streak: {longest} days</p>
    </div>
  );
}

function GemsPanel({ me }: { me: Me }) {
  return (
    <div className="flex items-center gap-4">
      <GemIcon className="size-14 shrink-0" />
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <h3 className="text-xl font-extrabold">Gems</h3>
          <p className="text-sm text-muted">You have {me.gems} gems. Spend them in the shop.</p>
        </div>
        <ButtonLink href="/shop" variant="outline" className="min-h-10 text-sm">
          Go to shop
        </ButtonLink>
      </div>
    </div>
  );
}

export function HeartsPanel({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  const { count, max, next_heart_at, refill_cost_gems } = me.hearts;
  const full = count >= max;
  const now = useNow(!full);
  const { refill, pending } = useHeartRefill();
  const canAfford = me.gems >= refill_cost_gems;
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-extrabold">Hearts</h3>
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, index) => (
          <HeartIcon key={index} empty={index >= count} className="size-9" />
        ))}
      </div>
      <p className="font-bold text-muted">
        {full
          ? "You have full hearts. Keep on learning!"
          : next_heart_at
            ? `Next heart in ${formatCountdown(new Date(next_heart_at).getTime() - now)}`
            : "Hearts regenerate over time."}
      </p>
      <Button variant="outline" disabled={full || !canAfford || pending} onClick={() => void refill()}>
        <span className="flex-1 text-left">Refill hearts</span>
        <GemIcon className="size-5" />
        <span className={canAfford ? "text-macaw" : "text-faint"}>{refill_cost_gems}</span>
      </Button>
      <Link
        href="/practice"
        onClick={onNavigate}
        className="text-center text-sm font-extrabold tracking-wider text-macaw uppercase hover:brightness-110"
      >
        Practice to earn hearts
      </Link>
    </div>
  );
}

function XpPanel({ me }: { me: Me }) {
  const { goal_xp, today_xp, completed } = me.daily_goal;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BoltIcon className="size-12" />
        <div>
          <h3 className="text-xl font-extrabold">{me.total_xp} total XP</h3>
          <p className="text-sm text-muted">{completed ? "Daily goal reached. Nice!" : "Keep going to hit your daily goal."}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={today_xp} max={goal_xp} color="var(--bee)" label="Daily goal" />
        <span className="shrink-0 text-sm font-extrabold text-muted">
          {Math.min(today_xp, goal_xp)} / {goal_xp} XP
        </span>
      </div>
    </div>
  );
}
