import type { Me } from "./types";

export interface Quest {
  id: string;
  title: string;
  progress: number;
  target: number;
}

/** Daily quests derived from today's activity (no extra storage needed). */
export function dailyQuests(me: Me): Quest[] {
  const { goal_xp, today_xp } = me.daily_goal;
  return [
    { id: "goal", title: `Earn ${goal_xp} XP`, progress: Math.min(today_xp, goal_xp), target: goal_xp },
    { id: "streak", title: "Extend your streak", progress: me.streak.active_today ? 1 : 0, target: 1 },
    { id: "xp50", title: "Earn 50 XP", progress: Math.min(today_xp, 50), target: 50 },
  ];
}
