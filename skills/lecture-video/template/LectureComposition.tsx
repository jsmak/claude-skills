import { AbsoluteFill, CalculateMetadataFunction, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { IntroCard } from "./IntroCard";
import { Slide } from "./Slide";
import { ProgressBar } from "./ProgressBar";
import { HighlightCue } from "./Highlight";
import { CROSSFADE, DEFAULT_INTRO_FRAMES, EXTRA_TAIL, FPS, THEME } from "./theme";

export type LectureConfig = {
  /** staticFile prefix - assets must live at public/<lectureDir>/{slides,audio}/page_NN.{png,wav} */
  lectureDir: string;
  pageCount: number;
  introTopLabel: string;
  introTitleMain: string;
  introTitleSub: string;
  /** frames the intro card holds before slide 1 starts fading in. Default 120 (4s @ 30fps). */
  introFrames?: number;
  /** optional word-synced highlight boxes, keyed by 0-based slide index */
  highlightsBySlide?: Record<number, HighlightCue[]>;
};

export type LectureProps = {
  slideFrames: number[];
  audioStarts: number[];
};

/**
 * Builds the calculateMetadata function for a lecture: probes each page's
 * wav duration and lays out frame-accurate start times, back to back, with
 * no gaps (crossfades are a purely visual overlap handled in Slide/IntroCard,
 * audio never overlaps).
 */
export const createLectureMetadataCalculator = (
  config: LectureConfig,
): CalculateMetadataFunction<LectureProps> => {
  return async () => {
    const introFrames = config.introFrames ?? DEFAULT_INTRO_FRAMES;

    const durationsSec = await Promise.all(
      Array.from({ length: config.pageCount }, (_, i) => {
        const pageNum = String(i + 1).padStart(2, "0");
        return getAudioDurationInSeconds(
          staticFile(`${config.lectureDir}/audio/page_${pageNum}.wav`),
        );
      }),
    );

    const slideFrames = durationsSec.map((sec) => Math.round(sec * FPS));

    const audioStarts: number[] = [];
    let cursor = introFrames;
    for (const frames of slideFrames) {
      audioStarts.push(cursor);
      cursor += frames;
    }

    const durationInFrames = cursor + EXTRA_TAIL;

    return {
      durationInFrames,
      props: { slideFrames, audioStarts },
    };
  };
};

/** Builds the React component for a lecture, closing over its config. */
export const createLectureComposition = (
  config: LectureConfig,
): React.FC<LectureProps> => {
  const LectureComposition: React.FC<LectureProps> = ({
    slideFrames,
    audioStarts,
  }) => {
    const lastIndex = config.pageCount - 1;
    const videoEnd =
      audioStarts[lastIndex] + slideFrames[lastIndex] + EXTRA_TAIL;

    return (
      <AbsoluteFill style={{ backgroundColor: THEME.bg }}>
        <IntroCard
          topLabel={config.introTopLabel}
          titleMain={config.introTitleMain}
          titleSub={config.introTitleSub}
          fadeOutStart={audioStarts[0] - CROSSFADE}
          fadeOutEnd={audioStarts[0]}
        />

        {slideFrames.map((duration, i) => {
          const start = audioStarts[i];
          const isLast = i === lastIndex;
          const fadeOutEnd = isLast ? videoEnd : audioStarts[i + 1];
          const fadeOutStart = isLast
            ? videoEnd - EXTRA_TAIL
            : audioStarts[i + 1] - CROSSFADE;

          return (
            <Slide
              key={i}
              lectureDir={config.lectureDir}
              index={i}
              total={config.pageCount}
              start={start}
              duration={duration}
              fadeInStart={start - CROSSFADE}
              fadeInEnd={start}
              fadeOutStart={fadeOutStart}
              fadeOutEnd={fadeOutEnd}
              panDirection={i % 2 === 0 ? 1 : -1}
              highlights={config.highlightsBySlide?.[i]}
            />
          );
        })}

        <ProgressBar />
      </AbsoluteFill>
    );
  };

  return LectureComposition;
};
