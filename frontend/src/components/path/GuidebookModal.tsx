"use client";

import { BookIcon, CloseIcon } from "@/components/icons";
import { SpeakerButton } from "@/components/SpeakerButton";
import { Modal } from "@/components/ui/Modal";
import { ErrorState, LoadingScreen } from "@/components/ui/StatusScreens";
import { useApiResource } from "@/hooks/useApiResource";
import { api } from "@/lib/api";
import { unitStyle } from "@/lib/themes";
import type { Unit } from "@/lib/types";

/** Key words and phrases taught in a unit. */
export function GuidebookModal({ unit, language, onClose }: { unit: Unit; language: string; onClose: () => void }) {
  const { data, error, reload } = useApiResource(`guidebook-${unit.id}`, () => api.guidebook(unit.id));
  return (
    <Modal open bare size="lg" onClose={onClose} labelledBy="guidebook-title">
      <div className="sticky top-0 z-10 flex items-start gap-3 p-5 text-white" style={{ ...unitStyle(unit.theme), background: "var(--unit)" }}>
        <BookIcon className="mt-1 size-7 shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] font-extrabold tracking-wider uppercase opacity-80">Unit {unit.position} guidebook</p>
          <h2 id="guidebook-title" className="text-xl font-extrabold">
            {unit.title}
          </h2>
        </div>
        <button type="button" aria-label="Close guidebook" onClick={onClose} className="rounded-lg p-1 hover:bg-black/10">
          <CloseIcon className="size-6" />
        </button>
      </div>
      <div className="flex flex-col gap-6 p-5">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : !data ? (
          <LoadingScreen />
        ) : (
          <>
            <p className="text-muted">{data.description}.</p>
            <section>
              <h3 className="mb-3 text-lg font-extrabold">Key words</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.words.map((word) => (
                  <div key={word.text} className="card flex items-center gap-3 p-3">
                    <SpeakerButton text={word.text} language={language} small />
                    <div className="min-w-0">
                      <p className="font-extrabold">{word.text}</p>
                      <p className="text-sm text-muted">{word.translation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-3 text-lg font-extrabold">Key phrases</h3>
              <ul className="flex flex-col gap-2">
                {data.phrases.map((phrase) => (
                  <li key={phrase.text} className="card flex items-center gap-3 p-3">
                    <SpeakerButton text={phrase.text} language={language} small />
                    <div>
                      <p className="font-extrabold">{phrase.text}</p>
                      <p className="text-sm text-muted">{phrase.translation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
