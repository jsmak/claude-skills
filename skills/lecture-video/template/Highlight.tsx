import { interpolate } from "remotion";
import { FPS, THEME } from "./theme";

export type HighlightCue = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  startSec: number; // relative to this slide's own audio timeline
  endSec: number;
};

type Props = HighlightCue & {
  frame: number; // global frame
  slideStart: number; // global frame where this slide's audio begins
};

const FADE = 8;

export const Highlight: React.FC<Props> = ({
  xPct,
  yPct,
  wPct,
  hPct,
  startSec,
  endSec,
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
        border: `3px solid ${THEME.gold}`,
        borderRadius: 14,
        boxShadow:
          "0 0 34px 4px rgba(194,168,120,0.55), inset 0 0 22px rgba(194,168,120,0.18)",
        background: "rgba(194,168,120,0.10)",
      }}
    />
  );
};
