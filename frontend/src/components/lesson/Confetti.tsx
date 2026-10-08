"use client";

import { useState } from "react";

const COLORS = ["#58cc02", "#1cb0f6", "#ff4b4b", "#ffc800", "#ce82ff", "#ff9600"];

/** Lightweight CSS confetti burst for celebration screens. */
export function Confetti({ pieces = 48 }: { pieces?: number }) {
  const [particles] = useState(() =>
    Array.from({ length: pieces }, (_, index) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.6,
      drift: (Math.random() - 0.5) * 160,
      size: 6 + Math.random() * 6,
      color: COLORS[index % COLORS.length],
      round: index % 3 === 0,
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {particles.map((particle, index) => (
        <span
          key={index}
          className="absolute top-0 block opacity-0"
          style={
            {
              left: `${particle.left}%`,
              width: particle.size,
              height: particle.round ? particle.size : particle.size * 1.6,
              borderRadius: particle.round ? "50%" : 2,
              background: particle.color,
              "--drift": `${particle.drift}px`,
              animation: `confetti-fall ${particle.duration}s ease-in ${particle.delay}s forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
