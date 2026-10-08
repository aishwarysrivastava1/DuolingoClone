"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { CourseFlag } from "@/components/Flag";
import { BoltIcon, CrownIcon, FlameIcon, GearIcon, StarIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ComingSoonBadge, ErrorState, LoadingScreen } from "@/components/ui/StatusScreens";
import { useToast } from "@/context/ToastContext";
import { useApiResource } from "@/hooks/useApiResource";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatMonthYear } from "@/lib/format";
import type { Achievement } from "@/lib/types";

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-lg leading-tight font-extrabold">{value}</p>
        <p className="truncate text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  const unlocked = achievement.unlocked_at !== null;
  return (
    <div className="flex items-center gap-4 border-b-2 border-line p-4 last:border-0">
      <span
        className={cn(
          "flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl",
          unlocked ? "bg-bee shadow-[0_4px_0_var(--bee-dark)]" : "bg-line grayscale",
        )}
        aria-hidden
      >
        {achievement.icon}
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-extrabold">{achievement.title}</h3>
          {unlocked ? (
            <span className="text-xs font-extrabold tracking-wider text-feather uppercase">Unlocked</span>
          ) : (
            <span className="text-sm font-bold text-muted">
              {achievement.progress}/{achievement.threshold}
            </span>
          )}
        </div>
        {!unlocked && <ProgressBar value={achievement.progress} max={achievement.threshold} color="var(--bee)" height="h-3" />}
        <p className="text-sm text-muted">{achievement.description}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const toast = useToast();
  const { data, error, reload } = useApiResource("profile", api.profile);
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return <LoadingScreen />;
  const { me, stats, achievements } = data;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5 border-b-2 border-line pb-6 sm:flex-row sm:items-center">
        <Avatar name={me.display_name} color={me.avatar_color} className="size-28 text-5xl shadow-[0_6px_0_rgb(0_0_0/0.12)]" />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold">{me.display_name}</h1>
          <p className="text-muted">@{me.username}</p>
          <p className="mt-2 text-muted">Joined {formatMonthYear(me.joined_on)}</p>
          <div className="mt-3 flex items-center gap-2">
            <CourseFlag language={me.course.learning_language} className="h-6 w-8" />
            <span className="font-bold text-muted">Learning {me.course.title}</span>
          </div>
        </div>
        <Link href="/settings" aria-label="Settings" className="btn btn-outline self-start px-3">
          <GearIcon className="size-6" />
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-extrabold">Statistics</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={<FlameIcon active={stats.streak > 0} className="size-8" />} value={stats.streak} label="Day streak" />
          <StatTile icon={<BoltIcon className="size-8" />} value={stats.total_xp} label="Total XP" />
          <StatTile icon={<CrownIcon className="size-8" />} value={stats.crowns} label="Crowns" />
          <StatTile icon={<StarIcon className="size-8 text-macaw" />} value={stats.lessons_completed} label="Lessons completed" />
          <StatTile icon={<FlameIcon className="size-8" />} value={stats.longest_streak} label="Longest streak" />
          <StatTile icon={<span className="text-2xl">🏅</span>} value={achievements.filter((a) => a.unlocked_at).length} label="Achievements" />
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="text-xl font-extrabold">{me.course.title} progress</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-bold text-muted">
            <span>Skills unlocked &amp; crowned</span>
            <span>
              {stats.skills_completed}/{stats.skills_total}
            </span>
          </div>
          <ProgressBar value={stats.skills_completed} max={stats.skills_total} label="Skills completed" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-bold text-muted">
            <span>Units completed</span>
            <span>
              {stats.units_completed}/{stats.units_total}
            </span>
          </div>
          <ProgressBar value={stats.units_completed} max={stats.units_total} color="var(--macaw)" label="Units completed" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-extrabold">Achievements</h2>
        <div className="card">
          {achievements.map((achievement) => (
            <AchievementRow key={achievement.code} achievement={achievement} />
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Friends</h2>
          <ComingSoonBadge />
        </div>
        <p className="text-muted">Following, followers and friend streaks will live here.</p>
        <button
          type="button"
          onClick={() => toast("Friends are coming soon!", { icon: "👋" })}
          className="btn btn-outline"
        >
          Find friends
        </button>
      </section>
    </div>
  );
}
