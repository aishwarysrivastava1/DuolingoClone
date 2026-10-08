import type { CSSProperties } from "react";
import type { UnitTheme } from "./types";

/** Main and shadow colour for each unit theme stored in the database. */
export const UNIT_COLORS: Record<UnitTheme, { main: string; dark: string }> = {
  green: { main: "#58cc02", dark: "#58a700" },
  purple: { main: "#ce82ff", dark: "#a568cc" },
  blue: { main: "#1cb0f6", dark: "#1899d6" },
  red: { main: "#ff4b4b", dark: "#ea2b2b" },
  orange: { main: "#ff9600", dark: "#e58600" },
};

/** Exposes a unit's colours as CSS variables (`--unit`, `--unit-dark`). */
export function unitStyle(theme: UnitTheme): CSSProperties {
  const { main, dark } = UNIT_COLORS[theme];
  return { "--unit": main, "--unit-dark": dark } as CSSProperties;
}
