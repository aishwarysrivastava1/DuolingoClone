"use client";

import { BoltIcon, ChestIcon, FlameIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { StreakWeek } from "@/components/shell/StatsBar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useUser } from "@/context/UserContext";
import { dailyQuests } from "@/lib/quests";

export default function QuestsPage() {
  const { me } = useUser();
  if (!me) return null;
  const { goal_xp, today_xp, completed } = me.daily_goal;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center gap-4 rounded-2xl bg-beetle p-5 text-white">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Daily Quests</h1>
          <p className="mt-1 font-semibold opacity-90">Complete quests every day to keep your learning on track.</p>
        </div>
        <Mascot mood="cheer" className="w-20 shrink-0" />
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <BoltIcon className="size-10" />
          <div className="flex-1">
            <h2 className="text-xl font-extrabold">Daily goal</h2>
            <p className="text-muted">
              {completed ? "Goal complete — amazing work!" : `${goal_xp - today_xp} XP to go today`}
            </p>
          </div>
          <span className="font-extrabold text-bee-dark">
            {today_xp} / {goal_xp} XP
          </span>
        </div>
        <ProgressBar value={today_xp} max={goal_xp} color="var(--bee)" label="Daily goal" />
      </section>

      <section className="card flex flex-col p-2">
        {dailyQuests(me).map((quest) => (
          <div key={quest.id} className="flex items-center gap-4 border-b-2 border-line p-3 last:border-0">
            {quest.id === "streak" ? <FlameIcon active={quest.progress > 0} className="size-10" /> : <BoltIcon className="size-10" />}
            <div className="flex flex-1 flex-col gap-2">
              <p className="font-extrabold">{quest.title}</p>
              <div className="relative">
                <ProgressBar value={quest.progress} max={quest.target} color="var(--bee)" height="h-5" label={quest.title} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-muted">
                  {quest.progress} / {quest.target}
                </span>
              </div>
            </div>
            <ChestIcon className={quest.progress >= quest.target ? "size-10" : "size-10 opacity-40 grayscale"} />
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <FlameIcon active={me.streak.active_today} className="size-10" />
          <h2 className="text-xl font-extrabold">{me.streak.count} day streak</h2>
        </div>
        <StreakWeek week={me.streak.week} today={me.today} />
      </section>
    </div>
  );
}
