"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { useSound } from "@/hooks/useSound";
import { ApiError, api, toApiError } from "@/lib/api";
import type { Answer, AnswerResult, Completion, Exercise, Hearts, Session, SessionMode } from "@/lib/types";

/**
 * Lesson player state machine.
 *
 *   loading ──► answering ──► checking ──► feedback ──► answering … ──► completing ──► complete
 *      │            ▲                          │
 *      ▼            └──── out_of_hearts ◄──────┘  (refill resumes the same session)
 *   blocked / load_error
 *
 * Wrong answers are re-queued at the end (Duolingo's "previous mistake"), and
 * the progress bar only advances on correct answers.
 */
export type LessonPhase =
  | "loading"
  | "blocked"
  | "load_error"
  | "answering"
  | "checking"
  | "feedback"
  | "out_of_hearts"
  | "completing"
  | "complete";

export interface LessonState {
  phase: LessonPhase;
  session: Session | null;
  queue: number[]; // exercise ids in play order
  cursor: number; // index into queue
  solved: number[];
  draft: Answer | null;
  result: AnswerResult | null;
  hearts: Hearts | null;
  combo: number;
  summary: Completion | null;
  error: ApiError | null;
}

export type LessonAction =
  | { type: "start" }
  | { type: "loaded"; session: Session }
  | { type: "blocked"; error: ApiError }
  | { type: "load_failed"; error: ApiError }
  | { type: "draft"; answer: Answer | null }
  | { type: "check_started" }
  | { type: "check_succeeded"; result: AnswerResult }
  | { type: "check_failed" }
  | { type: "hearts_depleted" }
  | { type: "continue" }
  | { type: "hearts_refilled"; hearts: Hearts }
  | { type: "complete_succeeded"; summary: Completion }
  | { type: "complete_failed"; error: ApiError }
  | { type: "complete_retry" };

export const initialLessonState: LessonState = {
  phase: "loading",
  session: null,
  queue: [],
  cursor: 0,
  solved: [],
  draft: null,
  result: null,
  hearts: null,
  combo: 0,
  summary: null,
  error: null,
};

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case "start":
      return initialLessonState;
    case "loaded":
      return {
        ...initialLessonState,
        phase: "answering",
        session: action.session,
        queue: action.session.exercises.map((exercise) => exercise.id),
        hearts: action.session.hearts,
      };
    case "blocked":
      return { ...state, phase: "blocked", error: action.error };
    case "load_failed":
      return { ...state, phase: "load_error", error: action.error };
    case "draft":
      return state.phase === "answering" ? { ...state, draft: action.answer } : state;
    case "check_started":
      return state.phase === "answering" ? { ...state, phase: "checking" } : state;
    case "check_succeeded":
      if (state.phase !== "checking") return state;
      return {
        ...state,
        phase: "feedback",
        result: action.result,
        hearts: action.result.hearts,
        combo: action.result.correct ? state.combo + 1 : 0,
      };
    case "check_failed":
      return state.phase === "checking" ? { ...state, phase: "answering" } : state;
    case "hearts_depleted":
      return { ...state, phase: "out_of_hearts", hearts: state.hearts && { ...state.hearts, count: 0 } };
    case "continue": {
      if (state.phase !== "feedback" || !state.result) return state;
      const exerciseId = state.queue[state.cursor];
      const correct = state.result.correct;
      const queue = correct ? state.queue : [...state.queue, exerciseId];
      const next: LessonState = {
        ...state,
        queue,
        cursor: state.cursor + 1,
        solved: correct ? [...state.solved, exerciseId] : state.solved,
        draft: null,
        result: null,
      };
      if (state.result.out_of_hearts) return { ...next, phase: "out_of_hearts" };
      return { ...next, phase: next.cursor >= queue.length ? "completing" : "answering" };
    }
    case "hearts_refilled":
      if (state.phase !== "out_of_hearts") return { ...state, hearts: action.hearts };
      return { ...state, hearts: action.hearts, phase: state.cursor >= state.queue.length ? "completing" : "answering" };
    case "complete_succeeded":
      return { ...state, phase: "complete", summary: action.summary, hearts: action.summary.hearts };
    case "complete_failed":
      return { ...state, error: action.error };
    case "complete_retry":
      return state.phase === "completing" ? { ...state, error: null } : state;
  }
}

/** Runs a lesson/practice session against the API on top of `lessonReducer`. */
export function useLessonEngine(mode: SessionMode, skillId: number | null) {
  const [state, dispatch] = useReducer(lessonReducer, initialLessonState);
  const latest = useRef(state);
  const sound = useSound();
  const toast = useToast();
  const { refresh } = useUser();

  useEffect(() => {
    latest.current = state;
  });

  const start = useCallback(async () => {
    dispatch({ type: "start" });
    try {
      dispatch({ type: "loaded", session: await api.startSession(mode, skillId) });
    } catch (err) {
      const error = toApiError(err);
      dispatch(error.code === "out_of_hearts" ? { type: "blocked", error } : { type: "load_failed", error });
    }
  }, [mode, skillId]);

  // Hearts change during play; re-sync the shared stats however the learner leaves.
  useEffect(() => () => void refresh(), [refresh]);

  // Start exactly once, even under React Strict Mode's double effects.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, [start]);

  const check = useCallback(
    async (answer?: Answer) => {
      const current = latest.current;
      const payload = answer ?? current.draft;
      if (current.phase !== "answering" || !payload || !current.session) return;
      latest.current = { ...current, phase: "checking" }; // block double submits before re-render
      dispatch({ type: "check_started" });
      try {
        const result = await api.submitAnswer(current.session.id, current.queue[current.cursor], payload);
        (result.correct ? sound.correct : sound.wrong)();
        dispatch({ type: "check_succeeded", result });
      } catch (err) {
        const error = toApiError(err);
        if (error.code === "out_of_hearts") {
          dispatch({ type: "hearts_depleted" });
        } else {
          toast(error.message, { tone: "error" });
          dispatch({ type: "check_failed" });
        }
      }
    },
    [sound, toast],
  );

  const setDraft = useCallback((answer: Answer | null) => dispatch({ type: "draft", answer }), []);
  const next = useCallback(() => dispatch({ type: "continue" }), []);
  const heartsRefilled = useCallback((hearts: Hearts) => dispatch({ type: "hearts_refilled", hearts }), []);
  const retryComplete = useCallback(() => dispatch({ type: "complete_retry" }), []);

  /** Close the session server-side when the learner quits. */
  const quit = useCallback(() => {
    const { session, phase } = latest.current;
    if (session && phase !== "complete") void api.abandonSession(session.id).catch(() => undefined);
  }, []);

  // Once every exercise is solved, ask the server to award XP / streak / progress.
  const completing = useRef(false);
  useEffect(() => {
    if (state.phase !== "completing" || state.error || !state.session || completing.current) return;
    completing.current = true;
    api
      .completeSession(state.session.id)
      .then((summary) => {
        sound.complete();
        dispatch({ type: "complete_succeeded", summary });
        void refresh();
      })
      .catch((err) => dispatch({ type: "complete_failed", error: toApiError(err) }))
      .finally(() => {
        completing.current = false;
      });
  }, [state.phase, state.error, state.session, sound, refresh]);

  const exercisesById = useMemo(
    () => new Map<number, Exercise>(state.session?.exercises.map((exercise) => [exercise.id, exercise]) ?? []),
    [state.session],
  );
  const exerciseId = state.queue[state.cursor];
  const total = state.session?.exercises.length ?? 0;

  return {
    state,
    exercise: exerciseId === undefined ? null : (exercisesById.get(exerciseId) ?? null),
    isRetry: state.cursor >= total && exerciseId !== undefined,
    progress: total ? state.solved.length / total : 0,
    start,
    check,
    setDraft,
    next,
    heartsRefilled,
    retryComplete,
    quit,
  };
}
