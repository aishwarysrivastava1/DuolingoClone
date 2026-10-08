/** The site's author: the single source of truth for every credit and contact link. */
export const AUTHOR = {
  name: "Aishwary Srivastava",
  email: "asrivastava1_be23@thapar.edu",
  university: "Thapar Institute of Engineering and Technology",
} as const;

export const AUTHOR_FIRST_NAME = AUTHOR.name.split(" ")[0];

/** "AS" for the contact card avatar. */
export const AUTHOR_INITIALS = AUTHOR.name
  .split(" ")
  .map((part) => part.charAt(0))
  .join("");

export const DEFAULT_CONTACT_SUBJECT = "Hello from the Duolingo clone";

/**
 * `mailto:` link to the author. Uses encodeURIComponent rather than
 * URLSearchParams because mail apps show a "+" literally instead of a space.
 */
export function authorMailto({ subject, body }: { subject?: string; body?: string } = {}): string {
  const params = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean);
  return `mailto:${AUTHOR.email}${params.length > 0 ? `?${params.join("&")}` : ""}`;
}
