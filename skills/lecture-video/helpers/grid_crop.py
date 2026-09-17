"""Crop a region of a slide PNG and draw a labeled coordinate grid on it, so
highlight boxes can be read off in the slide's own absolute pixels.

Grid labels are ABSOLUTE image coordinates, not crop-relative, so the numbers
you read go straight into defineHighlightRegions() without offset math.

Usage:
    python grid_crop.py <slide.png> <out.png> <x0> <y0> <x1> <y1> [--step 100]

View <out.png> with the Read tool. Crop generously (a whole diagram column,
a whole code panel) — two or three crops usually cover a busy slide.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("slide", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("box", nargs=4, type=int, metavar=("X0", "Y0", "X1", "Y1"))
    parser.add_argument("--step", type=int, default=100)
    args = parser.parse_args()

    x0, y0, x1, y1 = args.box
    step = args.step
    img = Image.open(args.slide).convert("RGB")
    crop = img.crop((x0, y0, x1, y1)).copy()
    draw = ImageDraw.Draw(crop)
    red, label = (255, 0, 0), (255, 80, 80)

    for x in range((x0 // step + 1) * step, x1, step):
        draw.line([(x - x0, 0), (x - x0, y1 - y0)], fill=red, width=1)
        draw.text((x - x0 + 2, 2), str(x), fill=label)
    for y in range((y0 // step + 1) * step, y1, step):
        draw.line([(0, y - y0), (x1 - x0, y - y0)], fill=red, width=1)
        draw.text((2, y - y0 + 2), str(y), fill=label)

    crop.save(args.out)
    print(f"{args.out} ({x1 - x0}x{y1 - y0}, grid every {step}px)")


if __name__ == "__main__":
    main()
