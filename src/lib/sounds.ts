// Web Audio API sound system — no external files, oscillator-based tones

let ctx: AudioContext | null = null;
const MUTE_KEY = "lucky-goal-muted";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function toggleMute(): boolean {
  const next = !isMuted();
  localStorage.setItem(MUTE_KEY, String(next));
  return next;
}

// Plays a single oscillator tone with a gain envelope
function tone(
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  peakGain = 0.4
): void {
  const ac = getCtx();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ac.currentTime + startTime);

  // Attack–sustain–release envelope
  const attack = 0.01;
  const release = 0.08;
  gain.gain.setValueAtTime(0, ac.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(peakGain, ac.currentTime + startTime + attack);
  gain.gain.setValueAtTime(peakGain, ac.currentTime + startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + startTime + duration);

  osc.start(ac.currentTime + startTime);
  osc.stop(ac.currentTime + startTime + duration);
}

// Short ascending two-note ding
export function playCorrect(): void {
  if (isMuted()) return;
  tone(523, 0, 0.12, "sine", 0.35);      // C5
  tone(784, 0.1, 0.18, "sine", 0.35);    // G5
}

// Short descending buzz
export function playIncorrect(): void {
  if (isMuted()) return;
  tone(300, 0, 0.1, "sawtooth", 0.25);
  tone(200, 0.08, 0.18, "sawtooth", 0.2);
}

// ~1s crowd fanfare: rapid ascending major arpeggio
export function playGoal(): void {
  if (isMuted()) return;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(freq, i * 0.15, 0.22, "triangle", 0.45);
  });
  // Extra shimmer on top
  tone(1319, 0.5, 0.35, "sine", 0.2); // E6
}

// Short low whomp
export function playSaved(): void {
  if (isMuted()) return;
  tone(140, 0, 0.08, "sine", 0.5);
  tone(100, 0.06, 0.22, "sine", 0.35);
}

// ~1.5s victory fanfare: trumpet-like ascending sequence
export function playWin(): void {
  if (isMuted()) return;
  const sequence: [number, number, number][] = [
    // [freq, start, duration]
    [523,  0,    0.15],   // C5
    [523,  0.13, 0.15],   // C5
    [659,  0.26, 0.15],   // E5
    [523,  0.39, 0.15],   // C5
    [784,  0.52, 0.25],   // G5
    [1047, 0.75, 0.55],   // C6 — hold
  ];
  sequence.forEach(([freq, start, dur]) => {
    tone(freq, start, dur, "square", 0.3);
    // Add a softer sine undertone for richness
    tone(freq * 0.5, start, dur, "sine", 0.15);
  });
}
