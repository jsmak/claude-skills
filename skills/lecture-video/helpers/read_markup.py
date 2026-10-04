"""Stage 2 of the highlight workflow: read red correction boxes off a proof PNG.

The person reviewing a proof draws a red rectangle (hollow or filled, any
editor) where a highlight should actually sit. This maps that rectangle back
into slide-PNG pixels - the coordinate space `defineHighlightRegions` takes -
so the fix goes straight into the config.

Usage:
  python read_markup.py marked.png --original proofs/02_p02_codeFwd.png \
      --slide public/lecture23/slides/page_02.png --pad 4

Always pass --original (the proof as it was handed over). Slides have red of
their own - arrows, warning boxes, dashed outlines - and without the original
to diff against, those get read as marks.

Prints, per box found:
  still px   : where it was drawn
  slide px   : the same box in slide-PNG pixels
  region     : [x0, y0, x1, y1] to paste into defineHighlightRegions(..., pad)

`region` is the box shrunk by `pad`, so the pad the region set adds back
reproduces exactly the rectangle that was drawn. Marking on the slide PNG
itself works too - pass --image-space slide.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image


def find_red_boxes(img, min_size, sat, original=None, diff_threshold=40):
    """Bounding boxes of connected red-ish blobs, via a simple flood fill.

    With `original` (the unmarked proof), only pixels that changed count, so
    red already present on the slide is ignored.
    """
    w, h = img.size
    px = img.load()
    base = original.load() if original is not None else None

    def is_red(x, y):
        r, g, b = px[x, y][:3]
        if not (r >= sat and g < r * 0.55 and b < r * 0.55):
            return False
        if base is None:
            return True
        br, bg, bb = base[x, y][:3]
        return abs(r - br) + abs(g - bg) + abs(b - bb) >= diff_threshold

    seen = bytearray(w * h)
    boxes = []
    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or not is_red(sx, sy):
                continue
            stack = [(sx, sy)]
            seen[sy * w + sx] = 1
            x0 = x1 = sx
            y0 = y1 = sy
            count = 0
            while stack:
                x, y = stack.pop()
                count += 1
                x0, x1 = min(x0, x), max(x1, x)
                y0, y1 = min(y0, y), max(y1, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] \
                            and is_red(nx, ny):
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if (x1 - x0) >= min_size and (y1 - y0) >= min_size:
                boxes.append((x0, y0, x1, y1, count))
    boxes.sort(key=lambda b: (b[1], b[0]))
    return boxes


def cover_map(still_w, still_h, slide_w, slide_h):
    """still px -> slide px, for an <Img> drawn with object-fit: cover."""
    f = max(still_w / slide_w, still_h / slide_h)
    off_x = (still_w - slide_w * f) / 2
    off_y = (still_h - slide_h * f) / 2

    def to_slide(x, y):
        return ((x - off_x) / f, (y - off_y) / f)

    return to_slide


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image", help="the marked-up proof PNG")
    ap.add_argument("--original",
                    help="the same proof before it was marked; pixels that did "
                         "not change are ignored, so red already on the slide "
                         "is not mistaken for a mark")
    ap.add_argument("--slide", help="that slide's page_NN.png, to read its size")
    ap.add_argument("--slide-size", help="WxH instead of --slide, e.g. 2880x1620")
    ap.add_argument("--image-space", choices=["still", "slide"], default="still",
                    help="'slide' when the mark was drawn on the slide PNG itself")
    ap.add_argument("--pad", type=int, default=10,
                    help="pad of the defineHighlightRegions set this goes into")
    ap.add_argument("--min-size", type=int, default=12,
                    help="ignore red blobs smaller than this (px)")
    ap.add_argument("--saturation", type=int, default=140,
                    help="minimum red channel value counted as a mark")
    args = ap.parse_args()

    img = Image.open(args.image).convert("RGB")
    sw, sh = img.size

    original = None
    if args.original:
        original = Image.open(args.original).convert("RGB")
        if original.size != img.size:
            sys.exit(f"--original is {original.size[0]}x{original.size[1]} but "
                     f"the marked image is {sw}x{sh}; they must match")

    if args.slide:
        slide_w, slide_h = Image.open(args.slide).size
    elif args.slide_size:
        slide_w, slide_h = (int(v) for v in args.slide_size.lower().split("x"))
    elif args.image_space == "slide":
        slide_w, slide_h = sw, sh
    else:
        sys.exit("pass --slide or --slide-size so the mark can be scaled")

    boxes = find_red_boxes(img, args.min_size, args.saturation, original)
    if not boxes:
        sys.exit("no red rectangle found - draw one, or lower --saturation")
    if original is None:
        print("note: no --original given, so red belonging to the slide itself "
              "may show up below\n")

    if args.image_space == "slide":
        to_slide = lambda x, y: (x, y)  # noqa: E731
    else:
        to_slide = cover_map(sw, sh, slide_w, slide_h)

    print(f"{Path(args.image).name}: {sw}x{sh} -> slide {slide_w}x{slide_h}, "
          f"pad {args.pad}\n")
    for n, (x0, y0, x1, y1, area) in enumerate(boxes, 1):
        sx0, sy0 = to_slide(x0, y0)
        sx1, sy1 = to_slide(x1, y1)
        rx0, ry0 = round(sx0) + args.pad, round(sy0) + args.pad
        rx1, ry1 = round(sx1) - args.pad, round(sy1) - args.pad
        off = ""
        if x0 <= 1 or y0 <= 1 or x1 >= sw - 2 or y1 >= sh - 2:
            off = "   (touches the frame edge - part of the mark may be cut off)"
        print(f"box {n}{off}")
        print(f"  still px : [{x0}, {y0}, {x1}, {y1}]  ({area} px marked)")
        print(f"  slide px : [{round(sx0)}, {round(sy0)}, "
              f"{round(sx1)}, {round(sy1)}]")
        print(f"  region   : [{rx0}, {ry0}, {rx1}, {ry1}]")
        if rx1 <= rx0 or ry1 <= ry0:
            print("  !! smaller than twice the pad - put it in a pad-0 set")
        print()


if __name__ == "__main__":
    main()
