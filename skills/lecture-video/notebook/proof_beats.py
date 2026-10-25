"""강조 확인용 이미지: beat 하나당 한 장 + 12장씩 묶은 시트.

    python proof_beats.py --remotion <프로젝트> --id <lecture id> --out "<강의 폴더>/강조_미리보기"

<프로젝트>의 NotebookPreview-<id> 컴포지션(강조가 자리를 잡은 뒤의 모습, beat 마다 한 프레임)을
PNG 시퀀스로 렌더링하고, 장면-순서 이름(S03-4.jpg)과 sheet_NN.png 를 만듭니다.
왼쪽 위 노란 번호는 확인용이며 실제 영상에는 나오지 않습니다.
"""
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--remotion", required=True)
ap.add_argument("--id", required=True)
ap.add_argument("--out", required=True)
a = ap.parse_args()

root = Path(a.remotion).resolve()
data = json.loads((root / "src" / "data" / f"{a.id}.json").read_text(encoding="utf-8"))
labels = [f"{s['id']}-{i + 1}" for s in data["scenes"] for i in range(len(s["beats"]))]

tmp = Path(tempfile.mkdtemp())
npx = shutil.which("npx") or "npx"
composition = "NotebookPreview-" + re.sub(r"[^A-Za-z0-9-]", "-", a.id)  # template/types.ts compositionId 와 같게
subprocess.run([npx, "remotion", "render", "src/index.ts", composition, str(tmp),
                "--sequence", "--image-format=png"], cwd=root, check=True)
frames = sorted(tmp.glob("*.png"))
assert len(frames) == len(labels), (len(frames), len(labels))

out = Path(a.out)
out.mkdir(parents=True, exist_ok=True)
for f, label in zip(frames, labels):
    Image.open(f).convert("RGB").save(out / f"{label}.jpg", quality=90)

W, H, PER = 640, 360, 12
for s in range(0, len(frames), PER):
    sheet = Image.new("RGB", (W * 3, H * 4), "white")
    for i, f in enumerate(frames[s:s + PER]):
        sheet.paste(Image.open(f).convert("RGB").resize((W - 4, H - 4), Image.LANCZOS), ((i % 3) * W, (i // 3) * H))
    sheet.save(out / f"sheet_{s // PER + 1:02d}.png")
shutil.rmtree(tmp, ignore_errors=True)
print(f"{len(frames)} proofs -> {out}")
