import { AbsoluteFill, CalculateMetadataFunction, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { IntroCard } from "./IntroCard";
import { Slide } from "./Slide";
import { ProgressBar } from "./ProgressBar";
import { HighlightCue } from "./Highlight";
import { TransitionType, resolveTransitions } from "./transitions";
import {
  DARK_THEME,
  DEFAULT_INTRO_FRAMES,
  EXTRA_TAIL,
  FPS,
  LectureTheme,
  TRANSITION_FRAMES,
} from "./theme";

export type LectureConfig = {
  /** staticFile prefix - assets must live at public/<lectureDir>/{slides,audio}/page_NN.{png,wav} */
  lectureDir: string;
  pageCount: number;
  introTopLabel: string;
  introTitleMain: string;
  introTitleSub: string;
  /** frames the intro card holds before slide 1 starts. Default 120 (4s @ 30fps). */
  introFrames?: number;
  /** palette override, merged over DARK_THEME. Pass LIGHT_THEME for white decks. */
  theme?: Partial<LectureTheme>;
  /**
   * Slide entrance animations. One TransitionType applies to every slide, an
   * array sets them per slide (index 0 = the intro -> slide 1 handoff, which
   * is always a crossfade). Omit for a varied default rotation.
   */
  transitions?: TransitionType | TransitionType[];
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
 * no gaps (transitions are a purely visual overlap handled in Slide, audio
 * never overlaps).
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
  const theme: LectureTheme = { ...DARK_THEME, ...config.theme };
  const transitions = resolveTransitions(config.pageCount, config.transitions);

  const LectureComposition: React.FC<LectureProps> = ({
    slideFrames,
    audioStarts,
  }) => {
    const lastIndex = config.pageCount - 1;
    const videoEnd =
      audioStarts[lastIndex] + slideFrames[lastIndex] + EXTRA_TAIL;

    return (
      <AbsoluteFill style={{ backgroundColor: theme.bg }}>
        <IntroCard
          theme={theme}
          topLabel={config.introTopLabel}
          titleMain={config.introTitleMain}
          titleSub={config.introTitleSub}
          fadeOutStart={audioStarts[0] - TRANSITION_FRAMES}
          fadeOutEnd={audioStarts[0]}
        />

        {slideFrames.map((duration, i) => {
          const start = audioStarts[i];
          const isLast = i === lastIndex;
          const fadeOutEnd = isLast ? videoEnd : audioStarts[i + 1];
          const fadeOutStart = isLast
            ? videoEnd - EXTRA_TAIL
            : audioStarts[i + 1] - TRANSITION_FRAMES;

          return (
            <Slide
              key={i}
              lectureDir={config.lectureDir}
              theme={theme}
              index={i}
              total={config.pageCount}
              start={start}
              duration={duration}
              fadeInStart={start - TRANSITION_FRAMES}
              fadeInEnd={start}
              fadeOutStart={fadeOutStart}
              fadeOutEnd={fadeOutEnd}
              enterTransition={transitions[i]}
              // the next slide's entrance drives this one's exit, so a push
              // moves both together; the last slide always fades to black
              exitTransition={isLast ? "crossfade" : transitions[i + 1]}
              panDirection={i % 2 === 0 ? 1 : -1}
              highlights={config.highlightsBySlide?.[i]}
            />
          );
        })}

        <ProgressBar accent={theme.accent} />
      </AbsoluteFill>
    );
  };

  return LectureComposition;
};
