"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";
import { isActive } from "./Sidebar";

/** Bottom tab bar for phones. */
export function MobileNav() {
  const pathname = usePathname();
  const { me } = useUser();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t-2 border-line bg-surface px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex size-12 items-center justify-center rounded-xl border-2",
              active ? "border-selected-line bg-selected-bg" : "border-transparent",
            )}
          >
            {Icon ? (
              <Icon className="size-8" />
            ) : (
              <Avatar name={me?.display_name ?? "?"} color={me?.avatar_color ?? "var(--line)"} className="size-8 text-sm" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
