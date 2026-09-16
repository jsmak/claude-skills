import { Easing, interpolate } from "remotion";

export type TransitionType =
  | "crossfade"
  | "pushLeft"
  | "pushUp"
  | "zoomIn"
  | "wipeRight";

const ROTATION: TransitionType[] = ["pushLeft", "zoomIn", "wipeRight", "pushUp"];

/**
 * One entry per slide: the transition played as that slide ENTERS.
 * Slide 0 enters from the intro card, which only knows how to fade, so it is
 * always a crossfade.
 */
export const resolveTransitions = (
  pageCount: number,
  spec: TransitionType | TransitionType[] | undefined,
): TransitionType[] => {
  if (typeof spec === "string") {
    return Array.from({ length: pageCount }, (_, i) =>
      i === 0 ? "crossfade" : spec,
    );
  }
  if (Array.isArray(spec)) {
    return Array.from(
      { length: pageCount },
      (_, i) => spec[i] ?? "crossfade",
    );
  }
  return Array.from({ length: pageCount }, (_, i) =>
    i === 0 ? "crossfade" : ROTATION[(i - 1) % ROTATION.length],
  );
};

export type SceneStyle = {
  opacity: number;
  transform: string;
  clipPath?: string;
};

/**
 * Enter and exit motion for one slide, in global frame terms.
 * Returns null when the slide is entirely off-screen so the caller can skip
 * rendering it (and, importantly, stop its audio from mounting).
 *
 * Push transitions keep both slides fully opaque and move them together —
 * the outgoing slide leaves in the same direction the incoming one arrives
 * from, so they read as one shove rather than a dissolve.
 */
export const computeSceneStyle = ({
  frame,
  fadeInStart,
  fadeInEnd,
  fadeOutStart,
  fadeOutEnd,
  enter,
  exit,
}: {
  frame: number;
  fadeInStart: number;
  fadeInEnd: number;
  fadeOutStart: number;
  fadeOutEnd: number;
  enter: TransitionType;
  exit: TransitionType;
}): SceneStyle | null => {
  if (frame < fadeInStart || frame >= fadeOutEnd) return null;

  const easing = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    easing: Easing.inOut(Easing.cubic),
  };
  const pIn = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], easing);
  const pOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [0, 1], easing);

  let opacityIn = 1;
  let opacityOut = 1;
  let tx = 0;
  let ty = 0;
  let scale = 1;
  let clipPath: string | undefined;

  switch (enter) {
    case "crossfade":
      opacityIn = pIn;
      break;
    case "pushLeft":
      tx += (1 - pIn) * 100;
      break;
    case "pushUp":
      ty += (1 - pIn) * 100;
      break;
    case "zoomIn":
      scale *= 1.18 - 0.18 * pIn;
      opacityIn = Math.min(1, pIn * 1.8);
      break;
    case "wipeRight":
      clipPath = `inset(0 ${(1 - pIn) * 100}% 0 0)`;
      break;
  }

  switch (exit) {
    case "crossfade":
      opacityOut = 1 - pOut;
      break;
    case "pushLeft":
      tx -= pOut * 100;
      break;
    case "pushUp":
      ty -= pOut * 100;
      break;
    case "zoomIn":
      scale *= 1 + 0.18 * pOut;
      opacityOut = 1 - pOut;
      break;
    case "wipeRight":
      // the incoming slide wipes over this one, so it just holds still
      break;
  }

  return {
    opacity: Math.min(opacityIn, opacityOut),
    transform: `translate3d(${tx}%, ${ty}%, 0) scale(${scale})`,
    clipPath,
  };
};
