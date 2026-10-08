import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function QuitModal({ open, onStay, onQuit }: { open: boolean; onStay: () => void; onQuit: () => void }) {
  return (
    <Modal open={open} onClose={onStay} labelledBy="quit-title">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot mood="sad" className="w-28" />
        <h2 id="quit-title" className="text-2xl font-extrabold">
          Wait, don&apos;t go!
        </h2>
        <p className="text-muted">You&apos;ll lose your progress if you quit now.</p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="secondary" onClick={onStay}>
          Keep learning
        </Button>
        <Button variant="ghost" className="text-cardinal" onClick={onQuit}>
          End session
        </Button>
      </div>
    </Modal>
  );
}
