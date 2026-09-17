import { HighlightCue } from "./Highlight";

type Box = readonly [x0: number, y0: number, x1: number, y1: number];

/**
 * Name the regions of one slide once, in the slide PNG's own pixels, then
 * build cues by name:
 *
 *   const at = defineHighlightRegions(2880, 1620, {
 *     diagFfn: [105, 1000, 485, 1085],
 *     codeFfn: [1480, 1317, 2340, 1350],
 *   });
 *   highlightsBySlide: { 0: [...at(["diagFfn", "codeFfn"], 486.2, 564.2)] }
 *
 * Every region listed in one `at()` call shares the same time window, which is
 * how a code line, its formula, and its diagram block light up together.
 */
export const defineHighlightRegions = <K extends string>(
  imageWidth: number,
  imageHeight: number,
  regions: Record<K, Box>,
  pad = 10,
) => {
  return (names: K[], startSec: number, endSec: number): HighlightCue[] =>
    names.map((name) => {
      const [x0, y0, x1, y1] = regions[name];
      return {
        xPct: (x0 - pad) / imageWidth,
        yPct: (y0 - pad) / imageHeight,
        wPct: (x1 - x0 + pad * 2) / imageWidth,
        hPct: (y1 - y0 + pad * 2) / imageHeight,
        startSec,
        endSec,
      };
    });
};
