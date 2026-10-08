// Tiny Web Audio synth for feedback sounds — no audio assets needed.

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(frequency: number, startIn: number, duration: number, type: OscillatorType = "sine", volume = 0.12) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + startIn;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export const sounds = {
  correct() {
    tone(784, 0, 0.12, "triangle");
    tone(1175, 0.09, 0.22, "triangle");
  },
  wrong() {
    tone(196, 0, 0.18, "square", 0.05);
    tone(147, 0.12, 0.28, "square", 0.05);
  },
  complete() {
    [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, index * 0.11, 0.3, "triangle"));
  },
  tap() {
    tone(660, 0, 0.05, "sine", 0.05);
  },
};
