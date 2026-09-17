"""Turn a Scribe transcript JSON into a readable timeline for authoring
highlight cues.

Default: one line per sentence, "[start-end] text", split on . ? !
With --words A B: every word whose start falls in [A, B] seconds, for
splitting a sentence that mentions two things (e.g. "4번 ... 5번").

Usage:
    python transcript_sentences.py <transcript.json> [-o out.txt]
    python transcript_sentences.py <transcript.json> --words 144 153

Writes UTF-8 to the -o file when given (read it with the Read tool); stdout
printing reconfigures itself to UTF-8 so it doesn't crash on a cp1252
Windows console.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("transcript", type=Path)
    parser.add_argument("-o", "--out", type=Path)
    parser.add_argument("--words", nargs=2, type=float, metavar=("START", "END"))
    args = parser.parse_args()

    data = json.loads(args.transcript.read_text(encoding="utf-8"))
    words = [w for w in data["words"] if w.get("type") == "word"]

    lines: list[str] = []
    if args.words:
        lo, hi = args.words
        for w in words:
            if lo <= w["start"] <= hi:
                lines.append(f"{w['start']:.2f}-{w['end']:.2f} {w['text']}")
    else:
        cur: list[str] = []
        start = None
        for w in words:
            if start is None:
                start = w["start"]
            cur.append(w["text"])
            if w["text"].endswith((".", "?", "!")):
                lines.append(f"[{start:6.1f}-{w['end']:6.1f}] {' '.join(cur)}")
                cur, start = [], None
        if cur:
            lines.append(f"[{start:6.1f}-      ] {' '.join(cur)}")

    text = "\n".join(lines)
    if args.out:
        args.out.write_text(text, encoding="utf-8")
        print(f"{len(lines)} lines -> {args.out}")
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(text)


if __name__ == "__main__":
    main()
