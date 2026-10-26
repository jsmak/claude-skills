"""장면 명세(scenes.json) + 노트북 레이아웃(layout.json) → Remotion 데이터.

    python build_scenes.py <scenes.json> --remotion <remotion 프로젝트>

- 박스는 셀·줄 번호로 적고(코드 줄, 출력 줄, 마크다운 블록), 여기서 캡처 이미지 픽셀로 바꿉니다.
- 캡처 이미지와 음성은 <remotion>/public/<id>/ 로 복사하고 (한글 파일 이름 그대로 두지 않음),
  데이터는 <remotion>/src/data/<id>.json 으로 씁니다.

박스 참조 형식 (beat 의 "boxes" 안):
  {"code": [cell, first, last]}   코드 셀의 first~last 줄 (1부터, last 생략 가능)
  {"out":  [cell, first, last]}   출력의 first~last 번째 줄 (빈 줄은 세지 않음)
  {"md":   [cell, first, last]}   마크다운 셀의 블록 (layout.json 의 markdown 순서, 1부터)
  {"px":   [x1, y1, x2, y2]}      캡처 이미지 픽셀 그대로
"""
import argparse
import json
import shutil
import statistics
import subprocess
import sys
import unicodedata
from pathlib import Path

PAD = 6          # 박스 여백 (이미지 px)
CODE_LEFT_PAD = 8  # 코드 박스 왼쪽은 줄 번호에 닿지 않게 좁게


def width(text):
    """고정폭 글꼴에서 차지하는 칸 수 (한글 등 전각 = 2칸)."""
    return sum(2 if unicodedata.east_asian_width(ch) in "WF" else 1 for ch in text)


def capture_size(path):
    """Width/height of a capture PNG, read from its IHDR chunk (no Pillow needed)."""
    with open(path, "rb") as f:
        head = f.read(24)
    return {"width": int.from_bytes(head[16:20], "big"), "height": int.from_bytes(head[20:24], "big")}


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(r.stdout)


class Geometry:
    def __init__(self, layout, notebook):
        self.k = layout["k"]
        self.cells = {c["i"]: c for c in layout["cells"]}
        widths = [c["code"]["charWidth"] for c in layout["cells"] if "code" in c]
        # 한 셀이 덜 그려진 상태로 재졌을 수 있어 중앙값을 씁니다
        self.char = statistics.median(widths) if widths else 7.0
        self.source = {i: "".join(c["source"]).split("\n") for i, c in enumerate(notebook["cells"])}

    def _px(self, x1, y1, x2, y2, scroll):
        k = self.k
        return [round(x1 * k), round((y1 - scroll) * k), round(x2 * k), round((y2 - scroll) * k)]

    def code(self, cell, first, last, scroll):
        c = self.cells[cell]["code"]
        lines = self.source[cell][first - 1:last]
        if not any(l.strip() for l in lines):
            raise ValueError(f"cell {cell} lines {first}-{last} are empty")
        indent = min(len(l) - len(l.lstrip()) for l in lines if l.strip())
        x1 = c["left"] + indent * self.char
        x2 = c["left"] + max(width(l.rstrip()) for l in lines) * self.char
        y1 = c["firstTop"] + (first - 1) * c["lineHeight"]
        y2 = c["firstTop"] + last * c["lineHeight"]
        b = self._px(x1, y1, x2, y2, scroll)
        return [b[0] - CODE_LEFT_PAD, b[1] - PAD, b[2] + 2 * PAD, b[3] + PAD]

    def out(self, cell, first, last, scroll):
        rows = self.cells[cell]["output"][first - 1:last]
        if not rows:
            raise ValueError(f"cell {cell} has no output lines {first}-{last}")
        x1 = min(r[1] for r in rows)
        x2 = max(r[2] for r in rows)
        y1 = rows[0][0]
        y2 = rows[-1][0] + rows[-1][3]
        b = self._px(x1, y1, x2, y2, scroll)
        return [b[0] - 2 * PAD, b[1] - PAD, b[2] + 2 * PAD, b[3] + PAD]

    def md(self, cell, first, last, scroll):
        blocks = self.cells[cell]["markdown"][first - 1:last]
        x1 = min(b[1] for b in blocks)
        x2 = max(b[2] for b in blocks)
        b = self._px(x1, blocks[0][0], x2, blocks[-1][3], scroll)
        return [b[0] - 3 * PAD, b[1] - 2 * PAD, b[2] + 3 * PAD, b[3] + 2 * PAD]

    def resolve(self, ref, scroll):
        (kind, args), = ref.items()
        if kind == "px":
            return list(args)
        first = args[1]
        last = args[2] if len(args) > 2 else first
        return getattr(self, kind)(args[0], first, last, scroll)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--remotion", required=True)
    a = ap.parse_args()

    spec_path = Path(a.spec).resolve()
    base = spec_path.parent
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    rel = lambda p: (base / p).resolve()

    geo = Geometry(json.loads(rel(spec["layout"]).read_text(encoding="utf-8")),
                   json.loads(rel(spec["notebook"]).read_text(encoding="utf-8")))
    captures = spec["captures"]  # 캡처 이름 -> 찍을 때의 scrollTop (css px)

    remotion = Path(a.remotion).resolve()
    public = remotion / "public" / spec["id"]
    public.mkdir(parents=True, exist_ok=True)
    for name in captures:
        shutil.copy2(rel(spec["imageDir"]) / f"{name}.png", public / f"{name}.png")

    scenes = []
    for n, s in enumerate(spec["scenes"]):
        audio_src = rel(spec["audioDir"]) / s["audio"]
        audio_name = f"scene_{n + 1:02d}{audio_src.suffix}"  # ASCII 이름으로 복사
        shutil.copy2(audio_src, public / audio_name)
        beats = []
        for b in s["beats"]:
            image = b.get("image", s["image"])
            boxes = [geo.resolve(r, captures[image]) for r in b.get("boxes", [])]
            beats.append({"t": b["t"], "caption": b.get("caption"), "boxes": boxes,
                          "image": image, "zoom": b.get("zoom", True)})
        beats.sort(key=lambda b: b["t"])
        scenes.append({"id": s["id"], "audio": audio_name, "duration": round(duration(audio_src), 3),
                       "beats": beats})

    data = {"id": spec["id"], "title": spec.get("title", ""), "summary": spec.get("summary", []),
            "thanksAt": spec.get("thanksAt"), "scenes": scenes,
            "capture": capture_size(rel(spec["imageDir"]) / f"{next(iter(captures))}.png")}
    if "captionPlaces" in spec:  # e.g. ["top", "middle"] to stay clear of YouTube subtitles
        data["captionPlaces"] = spec["captionPlaces"]
    out = remotion / "src" / "data" / f"{spec['id']}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(s["duration"] for s in scenes)
    print(f"wrote {out}: {len(scenes)} scenes, {sum(len(s['beats']) for s in scenes)} beats, "
          f"{total:.1f}s audio", file=sys.stderr)


if __name__ == "__main__":
    main()
