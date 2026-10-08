// Hand-drawn SVG icon set in Duolingo's flat, rounded style.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, viewBox = "0 0 24 24", ...props }: IconProps) {
  return (
    <svg viewBox={viewBox} aria-hidden focusable="false" {...props}>
      {children}
    </svg>
  );
}

export function FlameIcon({ active = true, ...props }: IconProps & { active?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12.4 1.6c.5 2.9 2.2 4.4 4 6.2 1.9 1.9 3.6 4 3.6 7.1A8 8 0 0 1 12 23a8 8 0 0 1-8-8.1c0-2.9 1.4-5 3.1-6.5.2 1.6.9 2.8 2 3.4-.4-4.3 1.1-7.8 3.3-10.2Z"
        fill={active ? "var(--fox)" : "var(--line)"}
      />
      <path
        d="M12.2 11.6c.4 1.6 1.4 2.5 2.3 3.4.7.8 1.2 1.6 1.2 2.7a3.7 3.7 0 0 1-7.4 0c0-1.3.6-2.3 1.4-3 .3.9.8 1.5 1.4 1.7-.1-1.9.3-3.4 1.1-4.8Z"
        fill={active ? "var(--bee)" : "var(--faint)"}
      />
    </Svg>
  );
}

export function GemIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.6 3h10.8L22 9.4 12 21.6 2 9.4Z" fill="#1cb0f6" />
      <path d="M2 9.4h20L17.4 3H6.6Z" fill="#84d8ff" />
      <path d="M7.8 9.4 12 21.6l4.2-12.2Z" fill="#49c0f8" />
      <path d="M7.8 9.4 9.8 3h4.4l2 6.4Z" fill="#ddf4ff" />
    </Svg>
  );
}

export function HeartIcon({ empty = false, ...props }: IconProps & { empty?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 21.3s-8.5-5.1-9.9-10.7C1.2 6.9 3.6 3.6 7.1 3.6c2.1 0 3.7 1.1 4.9 2.8 1.2-1.7 2.8-2.8 4.9-2.8 3.5 0 5.9 3.3 5 7-1.4 5.6-9.9 10.7-9.9 10.7Z"
        fill={empty ? "var(--line)" : "var(--cardinal)"}
      />
      {!empty && <ellipse cx="7.4" cy="8.2" rx="2.1" ry="1.3" fill="#fff" opacity=".5" transform="rotate(-38 7.4 8.2)" />}
    </Svg>
  );
}

export function BrokenHeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M11.2 5.6C10 4.3 8.7 3.6 7.1 3.6c-3.5 0-5.9 3.3-5 7 1.3 5.3 8.9 10.2 9.8 10.7l-1.4-6.1 2.6-2.6-2.3-3.1Z"
        fill="var(--line)"
      />
      <path
        d="M13 21.2c1.6-1 8-5.6 9-10.6.9-3.7-1.5-7-5-7-1.6 0-3 .7-4.1 1.8l1.6 3.4-2.6 2.7Z"
        fill="var(--line)"
      />
    </Svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 1.8 4.4 13.3h6.4L9.4 22.2l10.2-12.4h-6.5Z" fill="var(--bee)" strokeLinejoin="round" />
      <path d="M14 1.8 9.6 7.1l1.7.5Z" fill="#fff" opacity=".45" />
    </Svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7.8 7.4 11 12 4.4l4.6 6.6L21 7.8l-1.7 10H4.7Z" fill="var(--bee)" strokeLinejoin="round" />
      <rect x="4.7" y="17.8" width="14.6" height="2.6" rx="1" fill="var(--bee-dark)" />
      <circle cx="3" cy="7.8" r="1.5" fill="var(--bee)" />
      <circle cx="21" cy="7.8" r="1.5" fill="var(--bee)" />
      <circle cx="12" cy="4.4" r="1.5" fill="var(--bee)" />
    </Svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="m12 2.8 2.8 5.8 6.4.8-4.7 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4.5 12.5 5 5 10-11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 5.5l13 13m0-13-13 13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor" />
    </Svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 4.5H3.5v2a4 4 0 0 0 4 4M17.5 4.5h3v2a4 4 0 0 1-4 4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6.5 3h11v6a5.5 5.5 0 0 1-11 0Z" fill="currentColor" />
      <rect x="10.8" y="14" width="2.4" height="4" fill="currentColor" />
      <rect x="7.5" y="18" width="9" height="3" rx="1.2" fill="currentColor" />
    </Svg>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="9" width="3" height="6" rx="1.2" fill="currentColor" />
      <rect x="4.6" y="6.5" width="3.6" height="11" rx="1.5" fill="currentColor" />
      <rect x="8" y="10.8" width="8" height="2.4" fill="currentColor" />
      <rect x="15.8" y="6.5" width="3.6" height="11" rx="1.5" fill="currentColor" />
      <rect x="19" y="9" width="3" height="6" rx="1.2" fill="currentColor" />
    </Svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 6.2C10.2 4.8 7.4 4.2 3.5 4.5v14c3.9-.3 6.7.3 8.5 1.7 1.8-1.4 4.6-2 8.5-1.7v-14c-3.9-.3-6.7.3-8.5 1.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M12 6.2v14" stroke="currentColor" strokeWidth="2.2" />
    </Svg>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 9.2h3.6L12 5v14l-4.9-4.2H3.5Z" fill="currentColor" strokeLinejoin="round" />
      <path d="M15.3 8.8a4.5 4.5 0 0 1 0 6.4M18 6.2a8.2 8.2 0 0 1 0 11.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M12 7v5.3l3.4 2.1" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M10.3 2.5h3.4l.5 2.6 1.8.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.8 2.6.5v3.4l-2.6.5-.8 1.8 1.5 2.2-2.4 2.4-2.2-1.5-1.8.8-.5 2.6h-3.4l-.5-2.6-1.8-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.8-2.6-.5v-3.4l2.6-.5.8-1.8-1.5-2.2 2.4-2.4 2.2 1.5 1.8-.8Z"
        fill="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.3" fill="var(--surface)" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="m6.8 9.2 5.2 3.8 5.2-3.8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GraduationCapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 22.5 8.5 12 13.5 1.5 8.5Z" fill="currentColor" strokeLinejoin="round" />
      <path d="M5.5 11.5v4c0 1.9 2.9 3.6 6.5 3.6s6.5-1.7 6.5-3.6v-4L12 14.6Z" fill="currentColor" />
      <path d="M20.5 9.5V15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20.5" cy="16" r="1.3" fill="currentColor" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChestIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 10h18v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5Z" fill="#cd7900" />
      <path d="M3 10a6.5 6.5 0 0 1 6.5-6.5h5A6.5 6.5 0 0 1 21 10Z" fill="#ff9600" />
      <rect x="3" y="9.2" width="18" height="2.6" fill="var(--bee)" />
      <rect x="10" y="9" width="4" height="5.5" rx="1" fill="var(--bee)" />
      <circle cx="12" cy="12.2" r=".9" fill="#cd7900" />
    </Svg>
  );
}

// --- Navigation icons -------------------------------------------------------

export function HomeNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <path d="M6 14.5 16 6l10 8.5V26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill="#ffe8b3" />
      <path d="M3.5 15.5 16 4.5l12.5 11" fill="none" stroke="#ff4b4b" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="13" y="18" width="6" height="10" rx="1.5" fill="#cd7900" />
    </Svg>
  );
}

export function ShieldNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <path d="M16 3.5 26.5 7v8.6c0 6.3-4.4 10.6-10.5 12.9C9.9 26.2 5.5 21.9 5.5 15.6V7Z" fill="var(--bee)" />
      <path d="M16 3.5 26.5 7v8.6c0 6.3-4.4 10.6-10.5 12.9Z" fill="var(--bee-dark)" />
      <path d="m16 9.5 1.9 3.9 4.2.6-3 3 .7 4.2-3.8-2-3.8 2 .7-4.2-3-3 4.2-.6Z" fill="#fff" />
    </Svg>
  );
}

export function ChestNavIcon(props: IconProps) {
  return <ChestIcon {...props} />;
}

export function ShopNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <rect x="6" y="13" width="20" height="14" rx="2" fill="#ddf4ff" />
      <rect x="13" y="18" width="6" height="9" rx="1" fill="var(--macaw)" />
      <path d="M5 6h22l2 7H3Z" fill="var(--cardinal)" />
      <path d="M10.5 6h3.7l-.9 7H9.5ZM17.8 6h3.7l1 7h-3.8Z" fill="#fff" />
      <path d="M3 13a3.25 3.25 0 0 0 6.5 0 3.25 3.25 0 0 0 6.5 0 3.25 3.25 0 0 0 6.5 0 3.25 3.25 0 0 0 6.5 0Z" fill="var(--cardinal-dark)" />
    </Svg>
  );
}

export function MoreNavIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 32 32" {...props}>
      <circle cx="16" cy="16" r="12.5" fill="var(--beetle)" />
      <circle cx="10.5" cy="16" r="2.2" fill="#fff" />
      <circle cx="16" cy="16" r="2.2" fill="#fff" />
      <circle cx="21.5" cy="16" r="2.2" fill="#fff" />
    </Svg>
  );
}
