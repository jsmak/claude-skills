import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { LectureTheme } from "./theme";
import { Highlight, HighlightCue } from "./Highlight";
import { FrameSequence, FrameSequenceCue } from "./FrameSequence";
import { TransitionType, computeSceneStyle } from "./transitions";

type Props = {
  lectureDir: string; // staticFile prefix, e.g. "lecture1" for public/lecture1/...
  theme: LectureTheme;
  index: number; // 0-based
  total: number;
  start: number; // global frame this slide's audio begins
  duration: number; // frames, length of this slide's audio
  fadeInStart: number;
  fadeInEnd: number;
  fadeOutStart: number;
  fadeOutEnd: number;
  enterTransition: TransitionType;
  exitTransition: TransitionType;
  panDirection: 1 | -1;
  highlights?: HighlightCue[];
  frameSequences?: FrameSequenceCue[];
};

export const Slide: React.FC<Props> = ({
  lectureDir,
  theme,
  index,
  total,
  start,
  duration,
  fadeInStart,
  fadeInEnd,
  fadeOutStart,
  fadeOutEnd,
  enterTransition,
  exitTransition,
  panDirection,
  highlights,
  frameSequences,
}) => {
  const frame = useCurrentFrame();

  const scene = computeSceneStyle({
    frame,
    fadeInStart,
    fadeInEnd,
    fadeOutStart,
    fadeOutEnd,
    enter: enterTransition,
    exit: exitTransition,
  });

  if (scene === null || scene.opacity <= 0) return null;

  const progress = Math.min(Math.max((frame - start) / duration, 0), 1);
  const kenBurnsScale = interpolate(progress, [0, 1], [1, 1.07]);
  const translate = interpolate(progress, [0, 1], [0, 16 * panDirection]);

  const pageNum = String(index + 1).padStart(2, "0");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        opacity: scene.opacity,
        transform: scene.transform,
        clipPath: scene.clipPath,
      }}
    >
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            transform: `scale(${kenBurnsScale}) translateX(${translate}px)`,
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
          {frameSequences?.map((fs, fi) => (
            <FrameSequence key={`fs${fi}`} {...fs} frame={frame} slideStart={start} />
          ))}
          {highlights?.map((h, hi) => (
            <Highlight
              key={hi}
              {...h}
              accent={theme.accent}
              frame={frame}
              slideStart={start}
            />
          ))}
        </AbsoluteFill>
      </AbsoluteFill>

      <div
        style={{
          // tucked into the bottom edge: Ken Burns zoom pushes slide text
          // outward, and a higher counter ends up on top of the last line
          position: "absolute",
          bottom: 12,
          right: 28,
          color: theme.counterText,
          fontFamily: "Arial, sans-serif",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 1,
          background: theme.counterBg,
          padding: "4px 12px",
          borderRadius: 16,
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
