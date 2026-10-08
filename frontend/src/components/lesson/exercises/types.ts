import type { Answer, AnswerResult, Exercise } from "@/lib/types";

export interface ExerciseProps {
  exercise: Exercise;
  language: string;
  /** True once the answer has been submitted (checking or showing feedback). */
  locked: boolean;
  result: AnswerResult | null;
  onChange: (answer: Answer | null) => void;
  /** Submit immediately (used by match pairs once every pair is found). */
  onSubmit: (answer: Answer) => void;
}

/** Visual state for the learner's chosen card once the answer is graded. */
export function gradedState(selected: boolean, result: AnswerResult | null): string | undefined {
  if (!selected) return undefined;
  if (!result) return "selected";
  return result.correct ? "correct" : "wrong";
}
