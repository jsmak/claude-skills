import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "./theme";

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 5,
        width: `${pct}%`,
        background: THEME.gold,
      }}
    />
  );
};
