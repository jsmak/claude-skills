import { Img, interpolate, staticFile } from "remotion";
import { FPS } from "./theme";

/** One stretch of playback: frames fromFrame..toFrame over startSec..endSec. */
export type FrameSegment = {
  startSec: number; // relative to this slide's own audio timeline
  endSec: number;
  fromFrame: number;
  toFrame: number;
};

/**
 * A frame sequence (e.g. an animated GIF split into numbered images) placed
 * over a region of the slide and scrubbed to the narration.
 *
 * Between segments the last shown frame holds, so the animation pauses while
 * the narrator explains a step and resumes on the next segment. Before the
 * first segment, its fromFrame is shown.
 */
export type FrameSequenceCue = {
  /** staticFile directory holding frame_0000.<ext>, frame_0001.<ext>, ... */
  dir: string;
  ext: "jpg" | "png";
  frameCount: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  segments: FrameSegment[];
};

type Props = FrameSequenceCue & {
  frame: number; // global frame
  slideStart: number; // global frame where this slide's audio begins
};

export const frameAt = (segments: FrameSegment[], sec: number): number => {
  const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
  if (sorted.length === 0) return 0;
  if (sec < sorted[0].startSec) return sorted[0].fromFrame;
  let current = sorted[0];
  for (const seg of sorted) {
    if (seg.startSec <= sec) current = seg;
  }
  return Math.round(
    interpolate(
      sec,
      [current.startSec, current.endSec],
      [current.fromFrame, current.toFrame],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );
};

export const FrameSequence: React.FC<Props> = ({
  dir,
  ext,
  frameCount,
  xPct,
  yPct,
  wPct,
  hPct,
  segments,
  frame,
  slideStart,
}) => {
  const sec = (frame - slideStart) / FPS;
  const index = Math.min(Math.max(frameAt(segments, sec), 0), frameCount - 1);

  return (
    <Img
      src={staticFile(`${dir}/frame_${String(index).padStart(4, "0")}.${ext}`)}
      style={{
        position: "absolute",
        left: `${xPct * 100}%`,
        top: `${yPct * 100}%`,
        width: `${wPct * 100}%`,
        height: `${hPct * 100}%`,
        objectFit: "contain",
      }}
    />
  );
};
