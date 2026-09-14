"""Rasterize every page of a PDF (a slide deck export) into PNGs.

Renders at 2x zoom so a 16:9, 1280x720-equivalent deck comes out at
~2560x1440 - sharp enough for Ken Burns zoom/pan without upscaling blur.

Usage:
    python extract_slides.py <deck.pdf> <out_dir> [--zoom 2.0]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import fitz  # pymupdf


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("out_dir", type=Path)
    parser.add_argument("--zoom", type=float, default=2.0)
    args = parser.parse_args()

    if not args.pdf.exists():
        sys.exit(f"PDF not found: {args.pdf}")

    args.out_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(args.pdf)
    mat = fitz.Matrix(args.zoom, args.zoom)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=mat)
        out_path = args.out_dir / f"page_{i + 1:02d}.png"
        pix.save(str(out_path))
        print(f"{out_path.name}: {pix.width}x{pix.height}")

    print(f"done: {len(doc)} pages -> {args.out_dir}")


if __name__ == "__main__":
    main()
