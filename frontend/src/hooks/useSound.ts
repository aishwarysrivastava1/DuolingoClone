"use client";

import { useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { sounds } from "@/lib/sounds";

const SILENT: typeof sounds = { correct() {}, wrong() {}, complete() {}, tap() {} };

/** Feedback sounds that respect the learner's "sound effects" setting. */
export function useSound(): typeof sounds {
  const enabled = useUser().me?.settings.sound_enabled ?? true;
  return useMemo(() => (enabled ? sounds : SILENT), [enabled]);
}
