export type LectureTheme = {
  /** letterbox / intro-card background — match the deck's own background */
  bg: string;
  /** progress bar, intro label, highlight boxes */
  accent: string;
  /** intro card main title */
  title: string;
  /** intro card subtitle */
  subtitle: string;
  /** page counter chip */
  counterText: string;
  counterBg: string;
};

/** For decks on a dark background. */
export const DARK_THEME: LectureTheme = {
  bg: "#1c2230",
  accent: "#c2a878",
  title: "#f5f3ee",
  subtitle: "#c2a878",
  counterText: "#8a93a6",
  counterBg: "rgba(20,25,34,0.55)",
};

/** For decks on a white/light background. */
export const LIGHT_THEME: LectureTheme = {
  bg: "#ffffff",
  accent: "#e8871e",
  title: "#1c2230",
  subtitle: "#e8871e",
  counterText: "#5b6472",
  counterBg: "rgba(28,34,48,0.07)",
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const DEFAULT_INTRO_FRAMES = 120; // 4s title card before slide 1 starts
export const TRANSITION_FRAMES = 20; // 0.67s — long enough for motion to read
export const EXTRA_TAIL = 36; // ~1.2s fade to black after last narration ends
