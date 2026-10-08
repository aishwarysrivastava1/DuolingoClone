import type {
  Answer,
  AnswerResult,
  Completion,
  CoursePath,
  DevClock,
  Guidebook,
  Leaderboard,
  LeaderboardPeriod,
  Me,
  Profile,
  Session,
  SessionMode,
  SettingsPatch,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** A failed request. `code` mirrors the backend's stable error codes. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, "unknown_error", "Something went wrong. Please try again.");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Explain a failed fetch, calling out the two common deployment mistakes. */
function unreachableMessage(): string {
  if (typeof window !== "undefined") {
    try {
      const api = new URL(API_URL);
      if (isLocalHost(api.hostname) && !isLocalHost(window.location.hostname)) {
        return "This site isn't connected to its API: set NEXT_PUBLIC_API_URL to the backend URL and redeploy.";
      }
      if (api.protocol === "http:" && window.location.protocol === "https:" && !isLocalHost(api.hostname)) {
        return "The API URL must use https:// when the site is served over https. Update NEXT_PUBLIC_API_URL and redeploy.";
      }
    } catch {
      return "NEXT_PUBLIC_API_URL is not a valid URL. Fix it and redeploy.";
    }
  }
  return "Can't reach the server. Check your connection and try again.";
}

function browserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  // The backend uses the learner's timezone to decide what "today" is (streaks, daily goal).
  const timezone = browserTimezone();
  if (timezone) headers.set("X-Timezone", timezone);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "network_error", unreachableMessage());
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body?.error?.message ?? (typeof body?.detail === "string" ? body.detail : "Something went wrong.");
    throw new ApiError(response.status, body?.error?.code ?? "http_error", message);
  }
  return body as T;
}

function send<T>(method: "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
}

export const api = {
  me: () => request<Me>("/api/me"),
  profile: () => request<Profile>("/api/me/profile"),
  updateSettings: (patch: SettingsPatch) => send<Me>("PATCH", "/api/me/settings", patch),
  refillHearts: () => send<Me>("POST", "/api/me/hearts/refill"),

  path: () => request<CoursePath>("/api/path"),
  guidebook: (unitId: number) => request<Guidebook>(`/api/units/${unitId}/guidebook`),

  startSession: (mode: SessionMode, skillId: number | null) =>
    send<Session>("POST", "/api/sessions", { mode, skill_id: skillId }),
  submitAnswer: (sessionId: number, exerciseId: number, answer: Answer) =>
    send<AnswerResult>("POST", `/api/sessions/${sessionId}/answers`, { exercise_id: exerciseId, answer }),
  completeSession: (sessionId: number) => send<Completion>("POST", `/api/sessions/${sessionId}/complete`),
  abandonSession: (sessionId: number) => send<void>("POST", `/api/sessions/${sessionId}/abandon`),

  leaderboard: (period: LeaderboardPeriod) => request<Leaderboard>(`/api/leaderboard?period=${period}`),

  devClock: () => request<DevClock>("/api/dev/clock"),
  advanceDay: (days = 1) => send<DevClock>("POST", "/api/dev/advance-day", { days }),
  resetDemo: () => send<DevClock>("POST", "/api/dev/reset"),
};
