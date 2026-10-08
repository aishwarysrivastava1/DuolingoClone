"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ComingSoonBadge } from "@/components/ui/StatusScreens";
import { Toggle } from "@/components/ui/Toggle";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { api, toApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { parseLocalDate } from "@/lib/format";
import type { DailyGoalXp, SettingsPatch } from "@/lib/types";

const GOALS: { xp: DailyGoalXp; label: string }[] = [
  { xp: 10, label: "Casual" },
  { xp: 20, label: "Regular" },
  { xp: 30, label: "Serious" },
  { xp: 50, label: "Intense" },
];

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-line py-4 last:border-0">
      <div>
        <p className="font-extrabold">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { me, setMe, refresh } = useUser();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [devBusy, setDevBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!me) return null;

  const save = async (patch: SettingsPatch, message = "Settings saved") => {
    setSaving(true);
    try {
      setMe(await api.updateSettings(patch));
      toast(message, { tone: "success", icon: "✅" });
    } catch (error) {
      toast(toApiError(error).message, { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const runDevAction = async (action: () => Promise<{ today: string }>, message: (today: string) => string) => {
    setDevBusy(true);
    try {
      const clock = await action();
      await refresh();
      toast(message(clock.today), { icon: "🕒" });
    } catch (error) {
      toast(toApiError(error).message, { tone: "error" });
    } finally {
      setDevBusy(false);
    }
  };

  const today = parseLocalDate(me.today).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <section className="card px-5 py-2">
        <h2 className="pt-3 text-lg font-extrabold">Profile</h2>
        <NameForm
          key={me.display_name}
          initialName={me.display_name}
          saving={saving}
          onSave={(display_name) => void save({ display_name }, "Name updated")}
        />
      </section>

      <section className="card px-5 py-2">
        <h2 className="pt-3 text-lg font-extrabold">Daily goal</h2>
        <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4" role="radiogroup" aria-label="Daily goal">
          {GOALS.map((goal) => {
            const selected = me.settings.daily_goal_xp === goal.xp;
            return (
              <button
                key={goal.xp}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={saving}
                data-state={selected ? "selected" : undefined}
                onClick={() => !selected && void save({ daily_goal_xp: goal.xp }, `Daily goal set to ${goal.xp} XP`)}
                className="choice flex flex-col items-center px-3 py-3"
              >
                <span className="font-extrabold">{goal.label}</span>
                <span className={cn("text-sm", selected ? "text-selected-ink" : "text-muted")}>{goal.xp} XP / day</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card px-5 py-2">
        <h2 className="pt-3 text-lg font-extrabold">Preferences</h2>
        <Row title="Sound effects" description="Play sounds for correct and incorrect answers">
          <Toggle
            label="Sound effects"
            checked={me.settings.sound_enabled}
            disabled={saving}
            onChange={(checked) => void save({ sound_enabled: checked })}
          />
        </Row>
        <Row title="Dark mode" description="Saved on this device">
          <Toggle label="Dark mode" checked={theme === "dark"} onChange={(checked) => setTheme(checked ? "dark" : "light")} />
        </Row>
        <Row title="Notifications" description="Practice reminders and streak alerts">
          <ComingSoonBadge />
        </Row>
        <Row title="Privacy settings" description="Profile visibility and data">
          <ComingSoonBadge />
        </Row>
        <Row title="Super Duolingo" description="Manage your subscription">
          <ComingSoonBadge />
        </Row>
      </section>

      <section className="card border-dashed px-5 py-2">
        <h2 className="pt-3 text-lg font-extrabold">Demo tools</h2>
        <p className="text-sm text-muted">Simulate time passing to test streaks, daily goals and heart regeneration.</p>
        <Row title="Today is" description={today}>
          <Button
            variant="outline"
            disabled={devBusy}
            onClick={() => void runDevAction(() => api.advanceDay(1), () => "Moved to the next day")}
          >
            Next day
          </Button>
        </Row>
        <Row title="Reset demo data" description="Restore the seeded course, learner and leaderboard">
          <Button variant="danger" disabled={devBusy} onClick={() => setConfirmReset(true)}>
            Reset
          </Button>
        </Row>
      </section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} labelledBy="reset-title">
        <h2 id="reset-title" className="text-center text-2xl font-extrabold">
          Reset all progress?
        </h2>
        <p className="mt-2 text-center text-muted">XP, streaks, hearts and lesson progress go back to the seeded demo state.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="danger"
            disabled={devBusy}
            onClick={async () => {
              setConfirmReset(false);
              await runDevAction(api.resetDemo, () => "Demo data restored");
              router.push("/learn");
            }}
          >
            Reset progress
          </Button>
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function NameForm({ initialName, saving, onSave }: { initialName: string; saving: boolean; onSave: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const changed = trimmed !== "" && trimmed !== initialName;
  return (
    <form
      className="flex flex-col gap-3 py-4 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (changed) onSave(trimmed);
      }}
    >
      <label className="sr-only" htmlFor="display-name">
        Name
      </label>
      <input
        id="display-name"
        value={name}
        maxLength={30}
        onChange={(event) => setName(event.target.value)}
        className="min-h-12 flex-1 rounded-2xl border-2 border-line bg-surface-2 px-4 font-bold outline-none focus:border-macaw focus-visible:outline-none"
      />
      <Button type="submit" variant="secondary" disabled={saving || !changed}>
        Save
      </Button>
    </form>
  );
}
