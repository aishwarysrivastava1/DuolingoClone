import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "gold" | "outline" | "muted" | "ghost" | "white";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

/** Duolingo's chunky 3D button (styles live in globals.css → .btn). */
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn("btn", `btn-${variant}`, className)} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: ButtonVariant };

export function ButtonLink({ variant = "primary", className, href, ...props }: ButtonLinkProps) {
  return <Link href={href} className={cn("btn", `btn-${variant}`, className)} {...props} />;
}
