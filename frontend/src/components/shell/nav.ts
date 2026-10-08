import type { ComponentType, SVGProps } from "react";
import { ChestNavIcon, HomeNavIcon, ShieldNavIcon, ShopNavIcon } from "@/components/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>> | null; // null → learner avatar
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/learn", label: "Learn", icon: HomeNavIcon },
  { href: "/leaderboard", label: "Leaderboards", icon: ShieldNavIcon },
  { href: "/quests", label: "Quests", icon: ChestNavIcon },
  { href: "/shop", label: "Shop", icon: ShopNavIcon },
  { href: "/profile", label: "Profile", icon: null },
];
