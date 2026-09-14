import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "./theme";

type Props = {
  topLabel: string;
  titleMain: string;
  titleSub: string;
  fadeOutStart: number;
  fadeOutEnd: number;
};

export const IntroCard: React.FC<Props> = ({
  topLabel,
  titleMain,
  titleSub,
  fadeOutStart,
  fadeOutEnd,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const labelSpring = spring({ frame, fps, config: { damping: 16 } });
  const titleSpring = spring({ frame: frame - 6, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          transform: `scale(${0.9 + labelSpring * 0.1})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            opacity: labelSpring,
          }}
        >
          <div style={{ width: 48, height: 2, background: THEME.gold }} />
          <span
            style={{
              color: THEME.gold,
              fontFamily: "Arial, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 6,
            }}
          >
            {topLabel}
          </span>
          <div style={{ width: 48, height: 2, background: THEME.gold }} />
        </div>

        <div
          style={{
            color: THEME.white,
            fontFamily: "Arial, sans-serif",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -1,
            textAlign: "center",
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 24}px)`,
          }}
        >
          {titleMain}
        </div>
        <div
          style={{
            color: THEME.gold,
            fontFamily: "Arial, sans-serif",
            fontSize: 52,
            fontWeight: 700,
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 24}px)`,
          }}
        >
          {titleSub}
        </div>
      </div>
    </AbsoluteFill>
  );
};
