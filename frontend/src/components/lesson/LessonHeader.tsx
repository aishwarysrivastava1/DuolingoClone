import { CloseIcon, DumbbellIcon, HeartIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SessionMode } from "@/lib/types";

interface LessonHeaderProps {
  progress: number;
  hearts: number;
  mode: SessionMode;
  onQuit: () => void;
}

export function LessonHeader({ progress, hearts, mode, onQuit }: LessonHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-[1040px] items-center gap-4 px-4 pt-5 sm:px-10 sm:pt-12">
      <button type="button" aria-label="Quit lesson" onClick={onQuit} className="rounded-lg text-faint hover:text-muted">
        <CloseIcon className="size-7" />
      </button>
      <ProgressBar value={progress} label="Lesson progress" />
      {mode === "practice" ? (
        <span className="flex items-center gap-1.5 text-macaw" title="Practice doesn't cost hearts">
          <DumbbellIcon className="size-7" />
        </span>
      ) : (
        <span className="flex min-w-12 items-center gap-1.5 text-lg font-extrabold text-cardinal" aria-label={`${hearts} hearts`}>
          <HeartIcon key={hearts} empty={hearts === 0} className="animate-heart-pop size-7" />
          {hearts}
        </span>
      )}
    </header>
  );
}
