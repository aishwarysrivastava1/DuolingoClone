import { CheckIcon, CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import type { LessonPhase } from "@/hooks/useLessonEngine";
import { cn } from "@/lib/cn";
import type { AnswerResult } from "@/lib/types";

const PRAISE = ["Nicely done!", "Great job!", "Excellent!", "Amazing!", "You're correct!", "Awesome!"];

interface FeedbackFooterProps {
  phase: LessonPhase;
  result: AnswerResult | null;
  canCheck: boolean;
  showCheck: boolean;
  praiseIndex: number;
  onCheck: () => void;
  onSkip: () => void;
  onContinue: () => void;
}

/** Bottom bar: SKIP / CHECK while answering, then the green or red feedback panel. */
export function FeedbackFooter({ phase, result, canCheck, showCheck, praiseIndex, onCheck, onSkip, onContinue }: FeedbackFooterProps) {
  const graded = phase === "feedback" && result;
  const correct = graded && result.correct;

  return (
    <footer
      className={cn(
        "border-t-2",
        !graded && "border-line",
        graded && "border-transparent",
        correct && "bg-correct-bg",
        graded && !correct && "bg-wrong-bg",
      )}
    >
      <div className="mx-auto flex min-h-[140px] max-w-[1040px] flex-col justify-center gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        {!graded ? (
          <>
            <Button variant="muted" className="hidden sm:inline-flex sm:w-40" disabled={phase !== "answering"} onClick={onSkip}>
              Skip
            </Button>
            {showCheck ? (
              <Button className="w-full sm:w-40" disabled={!canCheck || phase !== "answering"} onClick={onCheck}>
                {phase === "checking" ? "Checking…" : "Check"}
              </Button>
            ) : (
              <Button variant="muted" className="w-full sm:hidden" disabled={phase !== "answering"} onClick={onSkip}>
                Skip
              </Button>
            )}
          </>
        ) : (
          <>
            <div key={praiseIndex} className="animate-slide-up flex items-center gap-4" role="status">
              <span className="hidden size-20 shrink-0 items-center justify-center rounded-full bg-surface sm:flex">
                {correct ? <CheckIcon className="size-10 text-feather" /> : <CloseIcon className="size-9 text-cardinal" />}
              </span>
              <div className={correct ? "text-correct-ink" : "text-wrong-ink"}>
                <h2 className="text-2xl font-extrabold">{correct ? PRAISE[praiseIndex % PRAISE.length] : "Correct solution:"}</h2>
                {correct && result.note && (
                  <p className="mt-1 text-lg">
                    {result.note} <strong>{result.solution}</strong>
                  </p>
                )}
                {!correct && <p className="mt-1 text-lg">{result.solution}</p>}
              </div>
            </div>
            <Button variant={correct ? "primary" : "danger"} className="w-full sm:w-40" onClick={onContinue} autoFocus>
              Continue
            </Button>
          </>
        )}
      </div>
    </footer>
  );
}
