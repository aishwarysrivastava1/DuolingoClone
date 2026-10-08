"use client";

import Link from "next/link";
import { DumbbellIcon, FlameIcon, GemIcon, HeartIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ComingSoonBadge } from "@/components/ui/StatusScreens";
import { useUser } from "@/context/UserContext";
import { useHeartRefill } from "@/hooks/useHeartRefill";
import { useNow } from "@/hooks/useNow";
import { formatCountdown } from "@/lib/format";

function ShopItem({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t-2 border-line py-5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center">{icon}</div>
        <div>
          <h3 className="text-lg font-extrabold">{title}</h3>
          <p className="text-muted">{description}</p>
        </div>
      </div>
      <div className="sm:w-48">{action}</div>
    </div>
  );
}

export default function ShopPage() {
  const { me } = useUser();
  const { refill, pending } = useHeartRefill();
  const full = me ? me.hearts.count >= me.hearts.max : true;
  const now = useNow(!full);
  if (!me) return null;
  const { count, max, next_heart_at, refill_cost_gems } = me.hearts;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Shop</h1>
        <span className="flex items-center gap-2 text-lg font-extrabold text-macaw">
          <GemIcon className="size-7" /> {me.gems}
        </span>
      </div>

      <section>
        <h2 className="mb-1 text-xl font-extrabold">Hearts</h2>
        <ShopItem
          icon={
            <div className="relative">
              <HeartIcon className="size-14" />
              <span className="absolute inset-0 flex items-center justify-center pb-1 text-sm font-black text-white">{count}</span>
            </div>
          }
          title="Refill hearts"
          description={
            full
              ? "You have full hearts. Get out there and learn!"
              : `${count}/${max} hearts${next_heart_at ? ` · next one in ${formatCountdown(new Date(next_heart_at).getTime() - now)}` : ""}`
          }
          action={
            <Button variant="outline" className="w-full" disabled={full || pending || me.gems < refill_cost_gems} onClick={() => void refill()}>
              {full ? (
                "Full"
              ) : (
                <>
                  Get for <GemIcon className="size-5" /> {refill_cost_gems}
                </>
              )}
            </Button>
          }
        />
        <ShopItem
          icon={<DumbbellIcon className="size-12 text-macaw" />}
          title="Practice to earn hearts"
          description="Each practice session you finish restores one heart — free."
          action={
            <Link href="/practice" className="btn btn-outline w-full">
              Practice
            </Link>
          }
        />
        <ShopItem
          icon={<HeartIcon className="size-14 opacity-70" />}
          title="Unlimited hearts"
          description="Never run out of hearts with Super Duolingo."
          action={<ComingSoonBadge />}
        />
      </section>

      <section>
        <h2 className="mb-1 text-xl font-extrabold">Power-ups</h2>
        <ShopItem
          icon={<FlameIcon className="size-14" style={{ filter: "hue-rotate(160deg)" }} />}
          title="Streak Freeze"
          description="Keep your streak in place for one full day of inactivity."
          action={<ComingSoonBadge />}
        />
        <ShopItem
          icon={<span className="text-5xl">🎲</span>}
          title="Double or Nothing"
          description="Double your gems by keeping a 7 day streak."
          action={<ComingSoonBadge />}
        />
      </section>
    </div>
  );
}
