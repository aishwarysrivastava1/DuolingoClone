"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ShieldNavIcon } from "@/components/icons";
import { ErrorState, LoadingScreen } from "@/components/ui/StatusScreens";
import { useApiResource } from "@/hooks/useApiResource";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/types";

const LEAGUES = [
  { name: "Bronze", color: "#cd7900" },
  { name: "Silver", color: "#c0c0c0" },
  { name: "Gold", color: "#ffc800" },
  { name: "Sapphire", color: "#1cb0f6" },
  { name: "Ruby", color: "#ff4b4b" },
];

const MEDALS = ["#ffc800", "#c0c0c0", "#cd7900"];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const { data, error, reload } = useApiResource(`leaderboard-${period}`, () => api.leaderboard(period));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-3" aria-hidden>
        {LEAGUES.map((league, index) => (
          <ShieldNavIcon
            key={league.name}
            className={cn("transition-all", index === 0 ? "size-20" : "size-12 opacity-30 grayscale")}
          />
        ))}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">{data?.league ?? "Bronze"} League</h1>
        <p className="mt-1 text-muted">
          {period === "week"
            ? `Top ${data?.promotion_cutoff ?? 5} advance to the next league · ${data?.days_left ?? "–"} days left`
            : "Everyone learning Spanish, ranked by total XP"}
        </p>
      </div>

      <div role="tablist" className="grid w-full max-w-sm grid-cols-2 rounded-2xl border-2 border-line p-1">
        {(["week", "all"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={period === value}
            onClick={() => setPeriod(value)}
            className={cn(
              "rounded-xl py-2 text-sm font-extrabold tracking-wider uppercase",
              period === value ? "bg-selected-bg text-selected-ink" : "text-faint hover:text-muted",
            )}
          >
            {value === "week" ? "This week" : "All time"}
          </button>
        ))}
      </div>

      <div className="w-full border-t-2 border-line pt-2">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : !data || data.period !== period ? (
          <LoadingScreen />
        ) : (
          <ol className="flex flex-col">
            {data.entries.map((entry) => (
              <li key={entry.user_id}>
                <LeaderboardRow entry={entry} />
                {period === "week" && entry.rank === data.promotion_cutoff && (
                  <div className="my-2 flex items-center gap-3 text-sm font-extrabold tracking-wider text-feather uppercase">
                    <span className="h-0.5 flex-1 bg-feather" />
                    ▲ Promotion zone ▲
                    <span className="h-0.5 flex-1 bg-feather" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const medal = MEDALS[entry.rank - 1];
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl px-4 py-3",
        entry.is_me ? "bg-selected-bg" : "hover:bg-surface-2",
      )}
    >
      <span className="flex w-8 justify-center">
        {medal ? (
          <span
            className="flex size-8 items-center justify-center rounded-full text-sm font-black text-white"
            style={{ background: medal }}
          >
            {entry.rank}
          </span>
        ) : (
          <span className="font-extrabold text-muted">{entry.rank}</span>
        )}
      </span>
      <Avatar name={entry.display_name} color={entry.avatar_color} className="size-12 text-lg" />
      <span className={cn("flex-1 truncate font-extrabold", entry.is_me && "text-selected-ink")}>
        {entry.display_name}
        {entry.is_me && " (you)"}
      </span>
      <span className="font-bold text-muted">{entry.xp} XP</span>
    </div>
  );
}
