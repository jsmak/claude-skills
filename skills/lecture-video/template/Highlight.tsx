import { interpolate } from "remotion";
import { FPS } from "./theme";

export type HighlightCue = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  startSec: number; // relative to this slide's own audio timeline
  endSec: number;
};

type Props = HighlightCue & {
  accent: string;
  frame: number; // global frame
  slideStart: number; // global frame where this slide's audio begins
};

const FADE = 8;

/** `#rrggbb` -> `rgba(r,g,b,a)`; passes any other color string through. */
const withAlpha = (color: string, alpha: number): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}, ${alpha})`;
};

export const Highlight: React.FC<Props> = ({
  xPct,
  yPct,
  wPct,
  hPct,
  startSec,
  endSec,
  accent,
  frame,
  slideStart,
}) => {
  const startFrame = slideStart + Math.round(startSec * FPS);
  const endFrame = slideStart + Math.round(endSec * FPS);

  const fadeIn = interpolate(frame, [startFrame, startFrame + FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [endFrame - FADE, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  if (opacity <= 0) return null;

  const scaleIn = interpolate(
    frame,
    [startFrame, startFrame + FADE],
    [0.94, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pulse = 1 + Math.sin((frame - startFrame) / 6) * 0.01;

  return (
    <div
      style={{
        position: "absolute",
        left: `${xPct * 100}%`,
        top: `${yPct * 100}%`,
        width: `${wPct * 100}%`,
        height: `${hPct * 100}%`,
        opacity,
        transform: `scale(${scaleIn * pulse})`,
        border: `3px solid ${accent}`,
        borderRadius: 14,
        boxShadow: `0 0 34px 4px ${withAlpha(accent, 0.55)}, inset 0 0 22px ${withAlpha(accent, 0.18)}`,
        background: withAlpha(accent, 0.1),
      }}
    />
  );
};
