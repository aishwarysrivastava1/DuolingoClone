// Original owl mascot drawn in SVG ("Oli"), with a few moods.

export type MascotMood = "happy" | "cheer" | "sad";

export function Mascot({ mood = "happy", className }: { mood?: MascotMood; className?: string }) {
  const wingsUp = mood === "cheer";
  return (
    <svg viewBox="0 0 120 132" className={className} aria-hidden focusable="false">
      {/* feet */}
      <ellipse cx="45" cy="124" rx="10" ry="5" fill="#ff9600" />
      <ellipse cx="75" cy="124" rx="10" ry="5" fill="#ff9600" />

      {/* wings */}
      {wingsUp ? (
        <>
          <path d="M24 70C10 62 3 46 5 30c11 6 20 18 24 34Z" fill="#58a700" />
          <path d="M96 70c14-8 21-24 19-40-11 6-20 18-24 34Z" fill="#58a700" />
        </>
      ) : (
        <>
          <path d="M22 60C8 70 6 94 18 108c6-14 9-32 8-48Z" fill="#58a700" />
          <path d="M98 60c14 10 16 34 4 48-6-14-9-32-8-48Z" fill="#58a700" />
        </>
      )}

      {/* ear tufts */}
      <path d="M27 28 21 6l22 12Z" fill="#58cc02" />
      <path d="M93 28 99 6 77 18Z" fill="#58cc02" />

      {/* body */}
      <path d="M20 44C20 20 37 10 60 10s40 10 40 34v44c0 22-17 34-40 34S20 110 20 88Z" fill="#58cc02" />

      {/* belly with feather marks */}
      <path d="M34 86c0-16 12-24 26-24s26 8 26 24-11 26-26 26-26-10-26-26Z" fill="#d7ffb8" />
      <path d="m48 80 4 4 4-4M64 80l4 4 4-4M56 92l4 4 4-4" fill="none" stroke="#89e219" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

      {/* eyes */}
      <circle cx="42" cy="44" r="17" fill="#fff" />
      <circle cx="78" cy="44" r="17" fill="#fff" />
      {mood === "sad" ? (
        <>
          <circle cx="43" cy="49" r="8" fill="#4b4b4b" />
          <circle cx="77" cy="49" r="8" fill="#4b4b4b" />
          <path d="M24 38c8-10 22-12 34-6v-8H24Z" fill="#58cc02" />
          <path d="M96 38c-8-10-22-12-34-6v-8h34Z" fill="#58cc02" />
        </>
      ) : (
        <>
          <circle cx="45" cy="46" r="8.5" fill="#4b4b4b" />
          <circle cx="75" cy="46" r="8.5" fill="#4b4b4b" />
          <circle cx="48" cy="42.5" r="3" fill="#fff" />
          <circle cx="78" cy="42.5" r="3" fill="#fff" />
        </>
      )}

      {/* beak */}
      <path d="M51 58c6-4 12-4 18 0-2 7-5 11-9 13-4-2-7-6-9-13Z" fill="#ff9600" />
      <path d="M51 58c6-4 12-4 18 0-6 3-12 3-18 0Z" fill="#ffc800" />
    </svg>
  );
}
