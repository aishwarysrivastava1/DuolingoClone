"use client";

import { BrokenHeartIcon, GemIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useHeartRefill } from "@/hooks/useHeartRefill";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";
import type { Me } from "@/lib/types";

interface OutOfHeartsModalProps {
  open: boolean;
  me: Me;
  onRefilled: (me: Me) => void;
  onPractice: () => void;
  onDismiss: () => void;
  dismissLabel?: string;
}

/** "You ran out of hearts!" — refill with gems, practice to earn one, or leave. */
export function OutOfHeartsModal({ open, me, onRefilled, onPractice, onDismiss, dismissLabel = "No thanks" }: OutOfHeartsModalProps) {
  const now = useNow(open);
  const { refill, pending } = useHeartRefill();
  const { next_heart_at, refill_cost_gems } = me.hearts;
  const canAfford = me.gems >= refill_cost_gems;

  return (
    <Modal open={open} labelledBy="no-hearts-title">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrokenHeartIcon className="size-24" />
        <h2 id="no-hearts-title" className="text-2xl font-extrabold">
          You ran out of hearts!
        </h2>
        <p className="text-muted">
          {next_heart_at
            ? `Your next heart regenerates in ${formatCountdown(new Date(next_heart_at).getTime() - now)}.`
            : "Hearts regenerate over time."}{" "}
          Refill now or practice to earn hearts back.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="secondary"
          disabled={!canAfford || pending}
          onClick={async () => {
            const updated = await refill();
            if (updated) onRefilled(updated);
          }}
        >
          <span className="flex-1 text-left">{canAfford ? "Refill hearts" : "Not enough gems"}</span>
          <GemIcon className="size-5" />
          {refill_cost_gems}
        </Button>
        <Button variant="outline" onClick={onPractice}>
          Practice to earn hearts
        </Button>
        <Button variant="ghost" className="text-muted" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      </div>
    </Modal>
  );
}
