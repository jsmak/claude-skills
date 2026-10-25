"""소리 없이 렌더링한 영상에 장면별 음성을 장면 길이에 맞춰 이어 붙입니다.

    python mux_audio.py --remotion <프로젝트> --id <lecture id> <video.mp4> <out.mp4>

Remotion 이 <Audio> 를 내려받을 때 localhost 가 IPv6(::1)로 연결되어 렌더링이 실패하는
환경이 있어서, 노트북 템플릿은 음성을 넣지 않고 렌더링한 뒤 여기서 붙입니다.
장면 길이 계산은 template/types.ts 의 sceneFrames 와 같아야 합니다.
"""
import argparse
import json
import math
import subprocess
from pathlib import Path

FPS, TAIL, RATE = 30, 0.6, 48000

ap = argparse.ArgumentParser()
ap.add_argument("--remotion", required=True)
ap.add_argument("--id", required=True)
ap.add_argument("video")
ap.add_argument("out")
a = ap.parse_args()

root = Path(a.remotion).resolve()
data = json.loads((root / "src" / "data" / f"{a.id}.json").read_text(encoding="utf-8"))

inputs, chains = [], []
for i, s in enumerate(data["scenes"]):
    frames = math.ceil((s["duration"] + TAIL) * FPS)
    inputs += ["-i", str(root / "public" / a.id / s["audio"])]
    chains.append(f"[{i + 1}:a]aresample={RATE},apad,atrim=end_sample={frames * RATE // FPS}[a{i}]")
n = len(data["scenes"])
graph = ";".join(chains) + ";" + "".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[aout]"

subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", a.video, *inputs,
                "-filter_complex", graph, "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", a.out], check=True)
print("wrote", a.out)
