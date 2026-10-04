"""Snap a roughly-drawn highlight box onto the content it is meant to cover.

Coordinates read off a scaled-down view of a slide are routinely 100-300px out
at 2880px, which is invisible in the config and obvious in the video. Give a
generous box around the target and this returns the exact ink bounds inside it,
ready to paste into `defineHighlightRegions`.

Usage:
  python snap_box.py public/lecture23/slides/page_04.png --box 1900 140 2520 275
  python snap_box.py slide.png --box 120 980 1500 1120 --pad 4 --invert

Prints the tight ink box, the region literal for the pad of the set it goes
into, and a warning when ink runs on past the edges of the box you gave -
which means the rough box cut the target in half rather than containing it.
"""

import argparse
import sys

import numpy as np
from PIL import Image


def ink_box(gray, x0, y0, x1, y1, dark):
    sub = gray[max(y0, 0):y1, max(x0, 0):x1]
    ys, xs = np.where(sub < dark)
    if len(xs) == 0:
        return None
    return [
        max(x0, 0) + int(xs.min()), max(y0, 0) + int(ys.min()),
        max(x0, 0) + int(xs.max()), max(y0, 0) + int(ys.max()),
    ]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image", help="the slide PNG (page_NN.png)")
    ap.add_argument("--box", nargs=4, type=int, required=True,
                    metavar=("X0", "Y0", "X1", "Y1"),
                    help="a generous box around the target")
    ap.add_argument("--pad", type=int, default=10,
                    help="pad of the defineHighlightRegions set this goes into")
    ap.add_argument("--dark", type=int, default=150,
                    help="max luminance counted as ink (raise for pale text)")
    ap.add_argument("--invert", action="store_true",
                    help="light text on a dark panel")
    ap.add_argument("--grow", type=int, default=60,
                    help="how far outside the box to look for ink that continues")
    args = ap.parse_args()

    img = Image.open(args.image).convert("L")
    w, h = img.size
    gray = np.asarray(img, dtype=int)
    if args.invert:
        gray = 255 - gray

    x0, y0, x1, y1 = args.box
    tight = ink_box(gray, x0, y0, x1, y1, args.dark)
    if tight is None:
        sys.exit("no ink inside that box - widen it, or adjust --dark/--invert")

    g = args.grow
    grown = ink_box(gray, max(x0 - g, 0), max(y0 - g, 0),
                    min(x1 + g, w), min(y1 + g, h), args.dark)

    print(f"{args.image}  {w}x{h}  pad {args.pad}")
    print(f"  given    : {args.box}")
    print(f"  ink box  : {tight}")
    print(f"  region   : [{tight[0]}, {tight[1]}, {tight[2]}, {tight[3]}]")
    print(f"  renders  : [{tight[0] - args.pad}, {tight[1] - args.pad}, "
          f"{tight[2] + args.pad}, {tight[3] + args.pad}]")

    runs = []
    if grown[0] < x0 - 1:
        runs.append(f"left by {x0 - grown[0]}+")
    if grown[1] < y0 - 1:
        runs.append(f"top by {y0 - grown[1]}+")
    if grown[2] > x1 + 1:
        runs.append(f"right by {grown[2] - x1}+")
    if grown[3] > y1 + 1:
        runs.append(f"bottom by {grown[3] - y1}+")
    if runs:
        print(f"  note     : ink continues past the box you gave ("
              f"{', '.join(runs)}).")
        print("             Either the target is cut off - widen --box and "
              "rerun - or that is the neighbouring line/panel.")


if __name__ == "__main__":
    main()
