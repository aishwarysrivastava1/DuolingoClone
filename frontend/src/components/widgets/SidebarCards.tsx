"use client";

import Link from "next/link";
import { BoltIcon, ChestIcon, ShieldNavIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { useApiResource } from "@/hooks/useApiResource";
import { api } from "@/lib/api";
import { dailyQuests } from "@/lib/quests";

function CardHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-extrabold">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-extrabold tracking-wider text-macaw uppercase hover:brightness-110">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Mocked Super subscription upsell. */
export function SuperCard() {
  const toast = useToast();
  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <span className="rounded-lg bg-gradient-to-r from-[#26ff55] via-[#0bc8ff] to-[#a560ff] bg-clip-text text-sm font-black tracking-widest text-transparent uppercase">
            Super
          </span>
          <h2 className="mt-1 text-xl font-extrabold">Try Super for free</h2>
          <p className="mt-1 text-muted">No ads, personalized practice, and unlimited hearts!</p>
        </div>
        <Mascot mood="cheer" className="w-16 shrink-0" />
      </div>
      <Button variant="secondary" onClick={() => toast("Super subscriptions are coming soon!", { icon: "✨" })}>
        Try 2 weeks free
      </Button>
    </section>
  );
}

export function LeagueCard() {
  const { data } = useApiResource("league-card", () => api.leaderboard("week"));
  const me = data?.entries.find((entry) => entry.is_me);
  return (
    <section className="card flex flex-col gap-4 p-5">
      <CardHeader title={`${data?.league ?? "Bronze"} League`} href="/leaderboard" linkLabel="View league" />
      <div className="flex items-center gap-4">
        <ShieldNavIcon className="size-12 shrink-0" />
        <div>
          <p className="font-extrabold">{me ? `You're ranked #${me.rank}` : "Loading your rank..."}</p>
          <p className="text-muted">{me ? `You've earned ${me.xp} XP this week so far` : " "}</p>
        </div>
      </div>
    </section>
  );
}

export function DailyQuestsCard({ limit = 1 }: { limit?: number }) {
  const { me } = useUser();
  if (!me) return null;
  return (
    <section className="card flex flex-col gap-4 p-5">
      <CardHeader title="Daily Quests" href="/quests" linkLabel="View all" />
      {dailyQuests(me)
        .slice(0, limit)
        .map((quest) => (
          <div key={quest.id} className="flex items-center gap-3">
            <BoltIcon className="size-9 shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <p className="font-extrabold">{quest.title}</p>
              <div className="relative">
                <ProgressBar value={quest.progress} max={quest.target} color="var(--bee)" height="h-5" label={quest.title} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-muted">
                  {quest.progress} / {quest.target}
                </span>
              </div>
            </div>
            <ChestIcon className="size-9 shrink-0" />
          </div>
        ))}
    </section>
  );
}
