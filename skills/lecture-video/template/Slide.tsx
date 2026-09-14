import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { THEME } from "./theme";
import { Highlight, HighlightCue } from "./Highlight";

type Props = {
  lectureDir: string; // staticFile prefix, e.g. "lecture1" for public/lecture1/...
  index: number; // 0-based
  total: number;
  start: number; // global frame this slide's audio begins
  duration: number; // frames, length of this slide's audio
  fadeInStart: number;
  fadeInEnd: number;
  fadeOutStart: number;
  fadeOutEnd: number;
  panDirection: 1 | -1;
  highlights?: HighlightCue[];
};

export const Slide: React.FC<Props> = ({
  lectureDir,
  index,
  total,
  start,
  duration,
  fadeInStart,
  fadeInEnd,
  fadeOutStart,
  fadeOutEnd,
  panDirection,
  highlights,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  if (opacity <= 0) return null;

  const progress = Math.min(Math.max((frame - start) / duration, 0), 1);
  const scale = interpolate(progress, [0, 1], [1, 1.07]);
  const translate = interpolate(progress, [0, 1], [0, 16 * panDirection]);

  const pageNum = String(index + 1).padStart(2, "0");

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bg, opacity }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            transform: `scale(${scale}) translateX(${translate}px)`,
          }}
        >
          <Img
            src={staticFile(`${lectureDir}/slides/page_${pageNum}.png`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {highlights?.map((h, hi) => (
            <Highlight key={hi} {...h} frame={frame} slideStart={start} />
          ))}
        </AbsoluteFill>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 40,
          color: THEME.muted,
          fontFamily: "Arial, sans-serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 1,
          background: "rgba(20,25,34,0.55)",
          padding: "6px 16px",
          borderRadius: 20,
        }}
      >
        {pageNum} / {String(total).padStart(2, "0")}
      </div>

      <Sequence from={start} durationInFrames={duration} layout="none">
        <Audio src={staticFile(`${lectureDir}/audio/page_${pageNum}.wav`)} />
      </Sequence>
    </AbsoluteFill>
  );
};
