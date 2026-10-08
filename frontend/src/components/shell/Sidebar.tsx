"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { DumbbellIcon, GearIcon, MoreNavIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, type NavItem } from "./nav";
import { HoverPopover } from "./Popover";

export function Logo() {
  return <span className="text-[32px] leading-none font-black tracking-tight text-feather">duolingo</span>;
}

function NavIcon({ item }: { item: NavItem }) {
  const { me } = useUser();
  if (item.icon) {
    const Icon = item.icon;
    return <Icon className="size-8 shrink-0" />;
  }
  return <Avatar name={me?.display_name ?? "?"} color={me?.avatar_color ?? "var(--line)"} className="size-8 text-sm" />;
}

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop navigation: icon rail on tablets, full labels from `lg`. */
export function Sidebar() {
  const pathname = usePathname();
  const toast = useToast();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[88px] flex-col border-r-2 border-line bg-surface px-3 py-6 md:flex lg:w-[256px] lg:px-4">
      <Link href="/learn" className="mb-6 flex h-12 items-center px-2 lg:px-4" aria-label="Home">
        <span className="hidden lg:block">
          <Logo />
        </span>
        <Mascot className="w-11 lg:hidden" />
      </Link>
      <nav className="flex flex-col gap-2" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center gap-5 rounded-xl border-2 px-3 py-2.5 lg:justify-start lg:px-4",
                active
                  ? "border-selected-line bg-selected-bg text-selected-ink"
                  : "border-transparent text-muted hover:bg-surface-2",
              )}
            >
              <NavIcon item={item} />
              <span className="hidden text-[15px] font-extrabold tracking-wider uppercase lg:inline">{item.label}</span>
            </Link>
          );
        })}
        <HoverPopover
          label="More"
          align="left"
          triggerClassName="flex w-full items-center justify-center gap-5 rounded-xl border-2 border-transparent px-3 py-2.5 text-muted hover:bg-surface-2 lg:justify-start lg:px-4"
          trigger={
            <>
              <MoreNavIcon className="size-8 shrink-0" />
              <span className="hidden text-[15px] font-extrabold tracking-wider uppercase lg:inline">More</span>
            </>
          }
        >
          {(close) => (
            <div className="-m-2 flex flex-col">
              <Link href="/settings" onClick={close} className="flex items-center gap-3 rounded-xl p-3 font-extrabold text-muted hover:bg-surface-2">
                <GearIcon className="size-6" /> Settings
              </Link>
              <Link href="/practice" onClick={close} className="flex items-center gap-3 rounded-xl p-3 font-extrabold text-muted hover:bg-surface-2">
                <DumbbellIcon className="size-6" /> Practice
              </Link>
              <button
                type="button"
                onClick={() => {
                  close();
                  toast("Help center is coming soon!", { icon: "🦉" });
                }}
                className="flex items-center gap-3 rounded-xl p-3 text-left font-extrabold text-muted hover:bg-surface-2"
              >
                <span className="flex size-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
                Help
              </button>
            </div>
          )}
        </HoverPopover>
      </nav>
    </aside>
  );
}
