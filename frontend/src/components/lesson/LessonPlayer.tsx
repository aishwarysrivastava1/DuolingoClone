"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OutOfHeartsModal } from "@/components/OutOfHeartsModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorState, LoadingScreen } from "@/components/ui/StatusScreens";
import { useUser } from "@/context/UserContext";
import { useLessonEngine } from "@/hooks/useLessonEngine";
import type { SessionMode } from "@/lib/types";
import { ExerciseView } from "./exercises/ExerciseView";
import { FeedbackFooter } from "./FeedbackFooter";
import { LessonComplete } from "./LessonComplete";
import { LessonHeader } from "./LessonHeader";
import { QuitModal } from "./QuitModal";

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center px-4">{children}</div>;
}

/** Full-screen lesson / practice player. */
export function LessonPlayer({ mode, skillId }: { mode: SessionMode; skillId: number | null }) {
  const router = useRouter();
  const { me } = useUser();
  const engine = useLessonEngine(mode, skillId);
  const { state, exercise } = engine;
  const [quitOpen, setQuitOpen] = useState(false);

  const leave = (href = "/learn") => {
    engine.quit();
    router.push(href);
  };

  // Enter = CHECK while answering, CONTINUE on the feedback bar.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || quitOpen) return;
      if (state.phase === "answering" && state.draft) {
        event.preventDefault();
        void engine.check();
      } else if (state.phase === "feedback") {
        event.preventDefault();
        engine.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, state.draft, quitOpen, engine]);

  if (state.phase === "loading") {
    return (
      <Centered>
        <LoadingScreen label={mode === "practice" ? "Loading practice..." : "Loading lesson..."} />
      </Centered>
    );
  }

  if (state.phase === "load_error") {
    return (
      <Centered>
        <ErrorState message={state.error?.message ?? "Couldn't start this lesson."} onRetry={() => void engine.start()} />
        <Button variant="ghost" onClick={() => router.push("/learn")}>
          Back to learning
        </Button>
      </Centered>
    );
  }

  if (state.phase === "blocked") {
    return (
      <Centered>
        <LoadingScreen label="Out of hearts" />
        {me && (
          <OutOfHeartsModal
            open
            me={me}
            onRefilled={() => void engine.start()}
            onPractice={() => router.push("/practice")}
            onDismiss={() => router.push("/learn")}
          />
        )}
      </Centered>
    );
  }

  if (state.phase === "complete" && state.summary) {
    return <LessonComplete summary={state.summary} onFinish={() => router.push("/learn")} />;
  }

  if (state.phase === "completing") {
    return (
      <Centered>
        <LoadingScreen label="Saving your progress..." />
        <Modal open={state.error !== null} labelledBy="save-error-title">
          <h2 id="save-error-title" className="text-center text-2xl font-extrabold">
            We couldn&apos;t save your lesson
          </h2>
          <p className="mt-2 text-center text-muted">{state.error?.message}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="secondary" onClick={engine.retryComplete}>
              Try again
            </Button>
            <Button variant="ghost" onClick={() => router.push("/learn")}>
              Back to learning
            </Button>
          </div>
        </Modal>
      </Centered>
    );
  }

  if (!state.session || !exercise) return null;
  const locked = state.phase !== "answering";

  return (
    <div className="flex min-h-dvh flex-col">
      <LessonHeader progress={engine.progress} hearts={state.hearts?.count ?? 0} mode={mode} onQuit={() => setQuitOpen(true)} />

      <main className="flex flex-1 justify-center px-4 py-6 sm:py-10">
        <div className="flex w-full max-w-[600px] flex-col gap-6">
          {engine.isRetry ? (
            <p className="flex items-center gap-2 text-sm font-extrabold tracking-wider text-fox uppercase">↻ Previous mistake</p>
          ) : (
            state.combo >= 2 && (
              <p className="animate-pop-in text-sm font-extrabold tracking-wider text-fox uppercase">🔥 {state.combo} in a row</p>
            )
          )}
          <h1 className="text-2xl font-extrabold sm:text-[32px] sm:leading-tight">{exercise.prompt}</h1>
          <ExerciseView
            key={`${exercise.id}-${state.cursor}`}
            exercise={exercise}
            language={state.session.learning_language}
            locked={locked}
            result={state.phase === "feedback" ? state.result : null}
            onChange={engine.setDraft}
            onSubmit={(answer) => void engine.check(answer)}
          />
        </div>
      </main>

      <FeedbackFooter
        phase={state.phase}
        result={state.result}
        canCheck={state.draft !== null}
        showCheck={exercise.type !== "match_pairs"}
        praiseIndex={state.cursor}
        onCheck={() => void engine.check()}
        onSkip={() => void engine.check({ type: "skip" })}
        onContinue={engine.next}
      />

      <QuitModal open={quitOpen} onStay={() => setQuitOpen(false)} onQuit={() => leave()} />
      {me && (
        <OutOfHeartsModal
          open={state.phase === "out_of_hearts"}
          me={me}
          onRefilled={(updated) => engine.heartsRefilled(updated.hearts)}
          onPractice={() => leave("/practice")}
          onDismiss={() => leave()}
          dismissLabel="End session"
        />
      )}
    </div>
  );
}
