"""Find the exact top/bottom pixel rows of each text line inside a region of a
slide PNG — the reliable way to place highlight boxes on code lines.

Code lines in a deck are typically ~7px apart at 2880px width, so eyeballed
coordinates either strike through the line above or the line itself. Scan
the column instead: every printed (top, bottom) pair is one line, in the
slide PNG's absolute pixels, ready for defineHighlightRegions.

Usage:
    python text_bands.py <slide.png> X0 Y0 X1 Y1 [--dark 140] [--min-height 6]

--dark: grayscale threshold for "ink". 140 suits dark text on white; for
light text on a dark panel use --invert. For pale/colored code text on a
white panel (orange, light purple), raise it to ~200.
Adjacent lines separated by a gap smaller than 1px merge into one band
(e.g. a line plus an arrow graphic crossing the gap) — split by eye.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("slide", type=Path)
    parser.add_argument("box", nargs=4, type=int, metavar=("X0", "Y0", "X1", "Y1"))
    parser.add_argument("--dark", type=int, default=140)
    parser.add_argument("--invert", action="store_true", help="light text on dark background")
    parser.add_argument("--min-height", type=int, default=6)
    parser.add_argument("--min-pixels", type=int, default=4)
    args = parser.parse_args()

    x0, y0, x1, y1 = args.box
    gray = np.asarray(Image.open(args.slide).convert("L")).astype(int)
    region = gray[y0:y1, x0:x1]
    ink = region > (255 - args.dark) if args.invert else region < args.dark
    rows = ink.sum(axis=1) >= args.min_pixels

    bands: list[tuple[int, int]] = []
    start = None
    for i, on in enumerate(rows):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start >= args.min_height:
                bands.append((y0 + start, y0 + i))
            start = None
    if start is not None and len(rows) - start >= args.min_height:
        bands.append((y0 + start, y1))

    for n, (top, bottom) in enumerate(bands):
        gap = "" if n == 0 else f"  gap {top - bands[n - 1][1]}px"
        print(f"{n:3d}: {top}-{bottom}  (h {bottom - top}){gap}")


if __name__ == "__main__":
    main()
