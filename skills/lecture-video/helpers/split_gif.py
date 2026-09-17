"""Split an animated GIF into numbered frames for FrameSequence, and build a
timestamped contact sheet for planning narration sync.

Frames are composited onto a solid background (GIF palettes/transparency
otherwise render inconsistently) and written as
<out_dir>/frame_0000.<ext>, frame_0001.<ext>, ...

The contact sheet shows every Nth frame labeled "frame i  t=s" (t in the
GIF's own timeline), so you can Read it once and map narration steps to
frame ranges without scrubbing the GIF.

Usage:
    python split_gif.py <anim.gif> <out_dir> [--ext jpg] [--bg 255,255,255]
                        [--sheet sheet.png] [--sheet-every 42]
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageSequence


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("gif", type=Path)
    parser.add_argument("out_dir", type=Path)
    parser.add_argument("--ext", choices=["jpg", "png"], default="jpg")
    parser.add_argument("--bg", default="255,255,255", help="R,G,B background")
    parser.add_argument("--sheet", type=Path)
    parser.add_argument("--sheet-every", type=int, default=40)
    args = parser.parse_args()

    bg_rgb = tuple(int(v) for v in args.bg.split(","))
    args.out_dir.mkdir(parents=True, exist_ok=True)

    gif = Image.open(args.gif)
    durations: list[int] = []
    thumbs: list[tuple[int, float, Image.Image]] = []
    elapsed_ms = 0

    for i, frame in enumerate(ImageSequence.Iterator(gif)):
        rgba = frame.convert("RGBA")
        flat = Image.new("RGB", rgba.size, bg_rgb)
        flat.paste(rgba, mask=rgba.split()[3])
        name = args.out_dir / f"frame_{i:04d}.{args.ext}"
        if args.ext == "jpg":
            flat.save(name, quality=92)
        else:
            flat.save(name)
        if i % args.sheet_every == 0:
            thumbs.append((i, elapsed_ms / 1000, flat.copy()))
        dur = frame.info.get("duration", 100)
        durations.append(dur)
        elapsed_ms += dur

    count = len(durations)
    unique = sorted(set(durations))
    fps = 1000 / unique[0] if len(unique) == 1 and unique[0] else None
    print(f"{count} frames, {gif.size[0]}x{gif.size[1]}, "
          f"total {elapsed_ms / 1000:.1f}s, frame durations(ms) {unique}"
          + (f" -> {fps:g} fps" if fps else " (variable timing)"))
    print(f"aspect w/h = {gif.size[0] / gif.size[1]:.4f}  -> {args.out_dir}")

    if args.sheet:
        cols = 5
        tw = 320
        th = round(tw * gif.size[1] / gif.size[0])
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw, rows * (th + 22)), "white")
        draw = ImageDraw.Draw(sheet)
        for k, (i, t, im) in enumerate(thumbs):
            x, y = (k % cols) * tw, (k // cols) * (th + 22)
            sheet.paste(im.resize((tw, th)), (x, y + 22))
            draw.text((x + 4, y + 4), f"frame {i}  t={t:.1f}s", fill="red")
        sheet.save(args.sheet)
        print(f"sheet: {args.sheet} ({len(thumbs)} thumbs, every {args.sheet_every} frames)")


if __name__ == "__main__":
    main()
