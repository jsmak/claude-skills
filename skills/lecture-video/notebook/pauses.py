"""장면별 음성에서 쉬는 구간을 찾아, 말이 다시 시작하는 시각을 보여 줍니다.

    python pauses.py <audio 폴더> [--min 0.25] [--noise -38]

출력 한 줄 = 파일 하나: `길이 | 시작시각(쉰 길이) ...`
0.6초 이상 쉰 곳이 대개 문장 경계이고, 짧은 것은 쉼표입니다. 대본의 문장을 차례로
대응시켜 beat 의 t 로 씁니다 (문장이 시작하는 시각 = 쉬는 구간이 끝나는 시각).
ElevenLabs 키가 있으면 Scribe 단어 타임스탬프가 더 정확하지만, 이것만으로도
0.5초 안쪽으로 맞습니다.
"""
import argparse
import re
import subprocess
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("folder")
ap.add_argument("--min", type=float, default=0.25, help="이보다 짧은 쉼은 무시 (초)")
ap.add_argument("--noise", type=float, default=-38, help="무음으로 볼 음량 (dB)")
a = ap.parse_args()

for f in sorted(Path(a.folder).iterdir()):
    if f.suffix.lower() not in (".mp3", ".wav", ".m4a"):
        continue
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-af",
                        f"silencedetect=noise={a.noise}dB:d={a.min}", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    ends = re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", r.stderr)
    total = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    secs = int(total[1]) * 3600 + int(total[2]) * 60 + float(total[3]) if total else 0
    marks = " ".join(f"{float(e):.2f}({float(d):.2f}){'*' if float(d) >= 0.6 else ''}" for e, d in ends)
    print(f"{f.name}  {secs:.1f}s | {marks}")
