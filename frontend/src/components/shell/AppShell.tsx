"use client";

import { ErrorState, LoadingScreen } from "@/components/ui/StatusScreens";
import { DailyQuestsCard, LeagueCard, SuperCard } from "@/components/widgets/SidebarCards";
import { useUser } from "@/context/UserContext";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { SiteFooter } from "./SiteFooter";
import { StatsBar } from "./StatsBar";

/**
 * Three-column Duolingo layout: navigation sidebar, main column and a right
 * rail with stats + widgets. Below `xl` the stats move to a sticky top bar and
 * below `md` navigation moves to a bottom tab bar. The author footer ends the
 * right rail on `xl` and the main column below it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, error, refresh } = useUser();

  if (!me) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        {error ? (
          <ErrorState message={error.message} onRetry={() => void refresh()} />
        ) : (
          <LoadingScreen slowHintAfterMs={4000} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="md:pl-[88px] lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b-2 border-line bg-bg px-2 py-2 sm:px-6 xl:hidden">
          <StatsBar className="mx-auto max-w-[600px]" />
        </header>
        <div className="mx-auto flex w-full max-w-[1080px] justify-center gap-12 px-4 pb-28 sm:px-6 md:pb-12 xl:px-8">
          <div className="w-full max-w-[600px] min-w-0">
            <main className="pt-6">{children}</main>
            <SiteFooter className="mt-12 border-t-2 border-line pt-8 xl:hidden" />
          </div>
          <aside className="sticky top-0 hidden w-[368px] shrink-0 flex-col gap-6 self-start py-6 xl:flex">
            <StatsBar />
            <SuperCard />
            <LeagueCard />
            <DailyQuestsCard />
            <SiteFooter className="px-4 pt-2" />
          </aside>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
