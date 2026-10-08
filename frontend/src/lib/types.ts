// Mirrors backend/app/schemas.py — the API contract.

export interface Course {
  id: number;
  code: string;
  title: string;
  learning_language: string;
  from_language: string;
}

export interface Hearts {
  count: number;
  max: number;
  next_heart_at: string | null;
  regen_minutes: number;
  refill_cost_gems: number;
}

export interface StreakDay {
  date: string;
  active: boolean;
}

export interface Streak {
  count: number;
  longest: number;
  active_today: boolean;
  week: StreakDay[];
}

export interface DailyGoalProgress {
  goal_xp: number;
  today_xp: number;
  completed: boolean;
}

export interface Me {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  joined_on: string;
  today: string;
  course: Course;
  total_xp: number;
  gems: number;
  hearts: Hearts;
  streak: Streak;
  daily_goal: DailyGoalProgress;
  settings: { sound_enabled: boolean; daily_goal_xp: number };
}

export type DailyGoalXp = 10 | 20 | 30 | 50;

export interface SettingsPatch {
  display_name?: string;
  daily_goal_xp?: DailyGoalXp;
  sound_enabled?: boolean;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  progress: number;
  unlocked_at: string | null;
}

export interface Profile {
  me: Me;
  stats: {
    streak: number;
    longest_streak: number;
    total_xp: number;
    crowns: number;
    lessons_completed: number;
    skills_completed: number;
    skills_total: number;
    units_completed: number;
    units_total: number;
  };
  achievements: Achievement[];
}

export type SkillState = "locked" | "active" | "completed";
export type UnitTheme = "green" | "purple" | "blue" | "red" | "orange";

export interface Skill {
  id: number;
  title: string;
  icon: string;
  state: SkillState;
  crown_level: number;
  max_crown_level: number;
  lessons_done: number;
  lessons_total: number;
}

export interface Unit {
  id: number;
  position: number;
  title: string;
  description: string;
  theme: UnitTheme;
  completed: boolean;
  skills: Skill[];
}

export interface CoursePath {
  course: Course;
  units: Unit[];
}

export interface GuidebookEntry {
  text: string;
  translation: string;
}

export interface Guidebook {
  unit_id: number;
  position: number;
  title: string;
  description: string;
  words: GuidebookEntry[];
  phrases: GuidebookEntry[];
}

export type ExerciseType = "multiple_choice" | "translate" | "match_pairs" | "fill_blank" | "type_answer";
export type SessionMode = "lesson" | "practice";

export interface ExerciseOption {
  id: number;
  text: string;
  image: string | null;
  match_text: string | null;
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string;
  source_text: string | null;
  translation: string | null;
  audio_text: string | null;
  options: ExerciseOption[];
}

export interface Session {
  id: number;
  mode: SessionMode;
  skill: { id: number; title: string; theme: UnitTheme; crown_level: number } | null;
  lesson_number: number | null;
  lessons_total: number | null;
  learning_language: string;
  hearts: Hearts;
  exercises: Exercise[];
}

export type Answer =
  | { type: "multiple_choice"; option_id: number }
  | { type: "fill_blank"; option_id: number }
  | { type: "translate"; option_ids: number[] }
  | { type: "match_pairs"; pairs: [number, number][] }
  | { type: "type_answer"; text: string }
  | { type: "skip" };

export interface AnswerResult {
  correct: boolean;
  solution: string;
  note: string | null;
  hearts: Hearts;
  out_of_hearts: boolean;
}

export interface Completion {
  session_id: number;
  mode: SessionMode;
  xp_earned: number;
  bonus_xp: number;
  accuracy: number;
  duration_seconds: number;
  total_xp: number;
  hearts: Hearts;
  heart_restored: boolean;
  streak: { count: number; extended: boolean; week: StreakDay[] };
  daily_goal: DailyGoalProgress & { just_completed: boolean };
  skill: {
    id: number;
    title: string;
    crown_level: number;
    max_crown_level: number;
    lessons_done: number;
    lessons_total: number;
    leveled_up: boolean;
  } | null;
  unlocked_skill: { id: number; title: string } | null;
  new_achievements: { code: string; title: string; description: string; icon: string }[];
}

export type LeaderboardPeriod = "week" | "all";

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_color: string;
  xp: number;
  is_me: boolean;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  league: string;
  days_left: number;
  promotion_cutoff: number;
  entries: LeaderboardEntry[];
}

export interface DevClock {
  day_offset: number;
  today: string;
}
