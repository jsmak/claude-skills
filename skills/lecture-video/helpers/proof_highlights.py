"""Stage 1 of the highlight workflow: render one still per highlight cue.

Renders a PNG at each cue's moment (so every box can be checked against the
slide it sits on), per-slide contact sheets and an index, without rendering the
video. The person reviewing draws a red rectangle over any box that sits in the
wrong place; read_markup.py turns that rectangle back into slide coordinates.

Write the proofs into the lecture folder the person already works in
(`<lecture folder>/proofs`), not a scratch directory - they have to be able to
open and mark them.

Usage:
  python proof_highlights.py \
      --project  C:/TRANSFORMER/fast-remotion \
      --composition Lecture23 \
      --lecture-dir public/lecture23 \
      --cues     cues.json \
      --out      "C:/TRANSFORMER/23강/proofs"

cues.json is a list of the cue calls, in the order they appear in the config:

  [
    {"slide": 0, "names": ["codeFwd", "diagAttn"], "start": 12.3, "end": 18.0},
    {"slide": 2, "names": ["table"], "start": 4.0, "end": 9.5}
  ]

Slide indices are 0-based, times are seconds within that slide's own audio -
exactly what the config holds, so the file stays a direct transcription of it.
"""

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw


def wav_duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "csv=p=0", str(path),
        ],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def slide_starts(audio_dir: Path, page_count: int, intro_frames: int, fps: int):
    """Global start frame of each slide, matching LectureComposition's layout."""
    starts = []
    cursor = intro_frames
    for i in range(1, page_count + 1):
        starts.append(cursor)
        dur = wav_duration(audio_dir / f"page_{i:02d}.wav")
        cursor += round(dur * fps)
    return starts


def label_for(cue, index):
    names = "+".join(cue.get("names", [])) or "cue"
    return f"{index:02d} p{cue['slide'] + 1:02d} {names} @{cue['start']:.1f}s"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, help="Remotion project root")
    ap.add_argument("--composition", required=True, help="e.g. Lecture23")
    ap.add_argument("--lecture-dir", required=True,
                    help="public/<lectureDir>, relative to the project")
    ap.add_argument("--cues", required=True, help="cues.json (see module docstring)")
    ap.add_argument("--out", required=True, help="directory for the proof PNGs")
    ap.add_argument("--intro-frames", type=int, default=120)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--offset", type=float, default=0.8,
                    help="seconds into the cue to sample (clamped to its length)")
    ap.add_argument("--slides", default="",
                    help="only these 0-based slide indices, e.g. 0,2")
    ap.add_argument("--only", default="",
                    help="only these cue indices (as printed), e.g. 3,4,9")
    ap.add_argument("--sheet-width", type=int, default=3,
                    help="tiles per row in the contact sheet")
    args = ap.parse_args()

    project = Path(args.project)
    audio_dir = project / args.lecture_dir / "audio"
    cues = json.loads(Path(args.cues).read_text(encoding="utf-8"))
    if not cues:
        sys.exit("no cues in " + args.cues)

    page_count = max(c["slide"] for c in cues) + 1
    pages_on_disk = len(list(audio_dir.glob("page_*.wav")))
    starts = slide_starts(audio_dir, max(page_count, pages_on_disk),
                          args.intro_frames, args.fps)

    want_slides = {int(s) for s in args.slides.split(",") if s.strip()}
    want_cues = {int(s) for s in args.only.split(",") if s.strip()}

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    rendered = []
    for i, cue in enumerate(cues):
        if want_slides and cue["slide"] not in want_slides:
            continue
        if want_cues and i not in want_cues:
            continue

        window = max(cue["end"] - cue["start"], 0.0)
        sec = cue["start"] + min(args.offset, window / 2 if window else 0.0)
        frame = starts[cue["slide"]] + round(sec * args.fps)

        names = "-".join(cue.get("names", [])) or "cue"
        safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in names)
        png = out_dir / f"{i:02d}_p{cue['slide'] + 1:02d}_{safe}.png"

        subprocess.run(
            ["npx", "remotion", "still", args.composition, str(png),
             f"--frame={frame}"],
            cwd=project, check=True,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            shell=(sys.platform == "win32"),
        )
        rendered.append((i, cue, frame, png))
        print(f"{i:02d}  slide {cue['slide'] + 1}  {sec:7.1f}s  frame {frame:6d}  "
              f"{'+'.join(cue.get('names', []))}")

    if not rendered:
        sys.exit("nothing matched the filters")

    def write_sheet(items, path):
        cols = max(1, args.sheet_width)
        rows = math.ceil(len(items) / cols)
        tw, th, pad = 640, 360, 26
        sheet = Image.new("RGB", (cols * tw, rows * (th + pad)), "white")
        draw = ImageDraw.Draw(sheet)
        for n, (i, cue, frame, png) in enumerate(items):
            tile = Image.open(png).convert("RGB").resize((tw, th))
            x, y = (n % cols) * tw, (n // cols) * (th + pad)
            sheet.paste(tile, (x, y + pad))
            draw.text((x + 6, y + 6), label_for(cue, i), fill="red")
        sheet.save(path)
        return path

    # one sheet per slide - a 40-tile sheet is unreviewable - plus one overall
    by_slide = {}
    for item in rendered:
        by_slide.setdefault(item[1]["slide"], []).append(item)
    sheets = [write_sheet(rendered, out_dir / "sheet_all.png")]
    for slide, items in sorted(by_slide.items()):
        sheets.append(write_sheet(items, out_dir / f"sheet_p{slide + 1:02d}.png"))

    index = out_dir / "index.md"
    with index.open("w", encoding="utf-8") as fh:
        fh.write(f"# Highlight proofs - {args.composition}\n\n")
        fh.write("Mark a red rectangle where a box should actually sit, on the\n")
        fh.write("file listed here, and send that file back. Leave the rest.\n\n")
        fh.write("| # | slide | highlight | time | file |\n")
        fh.write("|---|-------|-----------|------|------|\n")
        for i, cue, frame, png in rendered:
            fh.write(f"| {i:02d} | {cue['slide'] + 1} | "
                     f"{'+'.join(cue.get('names', []))} | "
                     f"{cue['start']:.1f}-{cue['end']:.1f}s | {png.name} |\n")

    print(f"\n{len(rendered)} proofs -> {out_dir}")
    for s in sheets:
        print(f"  sheet  {s.name}")
    print(f"  index  {index.name}")
    print("\nHand these to the person. Do not render the video until they have")
    print("marked what is wrong (red rectangle) or confirmed the boxes are right.")


if __name__ == "__main__":
    main()
