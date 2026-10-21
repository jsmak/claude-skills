import { AbsoluteFill, CalculateMetadataFunction, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { IntroCard } from "./IntroCard";
import { Slide } from "./Slide";
import { ProgressBar } from "./ProgressBar";
import { HighlightCue } from "./Highlight";
import { FrameSequenceCue } from "./FrameSequence";
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
  /**
   * Seconds of silence between a slide finishing its entrance and its
   * narration starting, so the voice doesn't land the instant the page
   * turns. Default 0 (back to back). Highlight/GIF cue times stay relative
   * to the page's audio, so they need no change when this is set.
   */
  audioLeadIn?: number;
  /** palette override, merged over DARK_THEME. Pass LIGHT_THEME for white decks. */
  theme?: Partial<LectureTheme>;
  /**
   * Slide entrance animations. One TransitionType applies to every slide, an
   * array sets them per slide (index 0 = the intro -> slide 1 handoff, which
   * is always a crossfade). Omit for a varied default rotation.
   */
  transitions?: TransitionType | TransitionType[];
  /**
   * Slow zoom/pan over each slide. Off by default: a dense deck ends a long
   * page 7% zoomed in, which crops the edges and carries highlight boxes out
   * of frame. Only turn it on for sparse slides with short narration.
   */
  kenBurns?: boolean;
  /** optional word-synced highlight boxes, keyed by 0-based slide index */
  highlightsBySlide?: Record<number, HighlightCue[]>;
  /** optional narration-scrubbed frame sequences (split GIFs), keyed by 0-based slide index */
  frameSequencesBySlide?: Record<number, FrameSequenceCue[]>;
};

export type LectureProps = {
  slideFrames: number[];
  audioStarts: number[];
};

/** config.audioLeadIn in whole frames. */
const leadInFrames = (config: LectureConfig) =>
  Math.round((config.audioLeadIn ?? 0) * FPS);

/**
 * Builds the calculateMetadata function for a lecture: probes each page's
 * wav duration and lays out frame-accurate start times. Each slide is on
 * screen for its lead-in plus its audio; transitions are a purely visual
 * overlap handled in Slide, and audio never overlaps.
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

    const leadIn = leadInFrames(config);
    const audioStarts: number[] = [];
    let cursor = introFrames;
    for (const frames of slideFrames) {
      audioStarts.push(cursor + leadIn);
      cursor += leadIn + frames;
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
  const leadIn = leadInFrames(config);

  const LectureComposition: React.FC<LectureProps> = ({
    slideFrames,
    audioStarts,
  }) => {
    const lastIndex = config.pageCount - 1;
    const videoEnd =
      audioStarts[lastIndex] + slideFrames[lastIndex] + EXTRA_TAIL;
    // frame each slide's entrance finishes (its narration starts leadIn later)
    const shownAt = audioStarts.map((s) => s - leadIn);

    return (
      <AbsoluteFill style={{ backgroundColor: theme.bg }}>
        <IntroCard
          theme={theme}
          topLabel={config.introTopLabel}
          titleMain={config.introTitleMain}
          titleSub={config.introTitleSub}
          fadeOutStart={shownAt[0] - TRANSITION_FRAMES}
          fadeOutEnd={shownAt[0]}
        />

        {slideFrames.map((duration, i) => {
          const start = audioStarts[i];
          const isLast = i === lastIndex;
          const fadeOutEnd = isLast ? videoEnd : shownAt[i + 1];
          const fadeOutStart = isLast
            ? videoEnd - EXTRA_TAIL
            : shownAt[i + 1] - TRANSITION_FRAMES;

          return (
            <Slide
              key={i}
              lectureDir={config.lectureDir}
              theme={theme}
              index={i}
              total={config.pageCount}
              start={start}
              duration={duration}
              fadeInStart={shownAt[i] - TRANSITION_FRAMES}
              fadeInEnd={shownAt[i]}
              fadeOutStart={fadeOutStart}
              fadeOutEnd={fadeOutEnd}
              enterTransition={transitions[i]}
              // the next slide's entrance drives this one's exit, so a push
              // moves both together; the last slide always fades to black
              exitTransition={isLast ? "crossfade" : transitions[i + 1]}
              panDirection={i % 2 === 0 ? 1 : -1}
              kenBurns={config.kenBurns ?? false}
              highlights={config.highlightsBySlide?.[i]}
              frameSequences={config.frameSequencesBySlide?.[i]}
            />
          );
        })}

        <ProgressBar accent={theme.accent} />
      </AbsoluteFill>
    );
  };

  return LectureComposition;
};
