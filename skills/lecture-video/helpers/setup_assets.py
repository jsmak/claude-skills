"""Stage a lecture's slide images + per-page narration into a Remotion
project's public/ folder with ASCII-safe filenames, and print each page's
audio duration (seconds) as JSON so it can be fed to a Remotion
calculateMetadata function or used directly for planning.

Windows note: source folders/filenames are typically Korean (e.g.
"1강_1페이지.wav"). Remotion's staticFile() can technically serve unicode
paths, but Windows consoles default to cp1252 and choke on printing Korean
text from Python (UnicodeEncodeError), and URL-encoding surprises are more
likely with unicode filenames. Renaming to page_01.png / page_01.wav here
sidesteps both problems permanently - do this once per lecture and forget
about the original filenames.

Usage:
    python setup_assets.py \
        --slides-dir "C:/.../slides" \
        --source-dir "C:/TRANSFORMER/1강_트랜스포머소개" \
        --wav-glob "1강_{n}페이지.wav" \
        --page-count 11 \
        --dest "C:/TRANSFORMER/fast-remotion/public/lecture1"
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slides-dir", type=Path, required=True, help="folder of page_NN.png from extract_slides.py")
    parser.add_argument("--source-dir", type=Path, required=True, help="folder holding the original per-page wav files")
    parser.add_argument("--wav-glob", required=True, help='filename pattern with {n} placeholder, e.g. "1강_{n}페이지.wav"')
    parser.add_argument("--page-count", type=int, required=True)
    parser.add_argument("--dest", type=Path, required=True, help="e.g. fast-remotion/public/lecture2")
    args = parser.parse_args()

    slides_dest = args.dest / "slides"
    audio_dest = args.dest / "audio"
    slides_dest.mkdir(parents=True, exist_ok=True)
    audio_dest.mkdir(parents=True, exist_ok=True)

    durations = {}
    for i in range(1, args.page_count + 1):
        page_num = f"{i:02d}"

        src_png = args.slides_dir / f"page_{page_num}.png"
        shutil.copy(src_png, slides_dest / f"page_{page_num}.png")

        src_wav = args.source_dir / args.wav_glob.format(n=i)
        dst_wav = audio_dest / f"page_{page_num}.wav"
        shutil.copy(src_wav, dst_wav)

        durations[page_num] = round(ffprobe_duration(dst_wav), 3)

    print(json.dumps(durations, indent=2))
    total = sum(durations.values())
    print(f"# total narration: {total:.1f}s ({total / 60:.1f} min) across {args.page_count} pages")


if __name__ == "__main__":
    main()
