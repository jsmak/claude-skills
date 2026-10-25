# Notebook mode: Jupyter/Colab notebook → narrated lecture video

The slide pipeline in SKILL.md starts from a deck. This one starts from an
`.ipynb` and the person's own explanation of it: Claude polishes the script,
the person voices it in ElevenLabs, Claude captures the notebook running in
Colab, and Remotion lays word-synced highlight boxes, zoom and short captions
over the captures. Built on lecture 03 (`01_tensor.ipynb`, 14 scenes, 9:22).

Everything here lives in `notebook/`:

| file | what it does |
|---|---|
| `capture.ps1` | (PowerShell 7) brings the Colab Chrome window forward and saves it as a 4K PNG (window-only capture) |
| `layout.js` | run in the Colab tab: measures every cell, code line and output line |
| `pauses.py` | lists where each narration file pauses — sentence starts for beat times |
| `build_scenes.py` | scene spec + layout → Remotion data, copies images/audio into `public/<id>/` |
| `proof_beats.py` | one still per beat + 12-up sheets for the person to approve |
| `mux_audio.py` | adds the narration to the silently rendered video |
| `template/` | Remotion module: spotlight boxes, camera zoom, captions, summary card |

## The order matters

Polish script → person makes audio → fix notebook & capture → measure layout →
write scene spec → **proofs, then stop for approval** → render → mux. Don't
render before the proofs are approved; a full render is 10+ minutes and the
proofs exist so a wrong box is caught as a still.

## 1. Script

The person usually pastes a rough spoken script. Read the notebook first
(`json` load; outputs can be large — print sources and text outputs only) and:

- **Fix facts against the notebook, not just typos.** Things that were wrong
  in the first draft: the row of a slice (`a[1:2, :2]` is row 1), a
  broadcasting rule stated as "rows or columns match" (`(2,3)+(2,)` errors), an
  assignment described as the existing value, "Colab needs PyTorch installed".
- **Split into scenes, one per screen** (S01, S02, …): a markdown intro, a code
  cell, its output, the next cell. A long cell can be two scenes (code, then
  output). Each scene gets `[화면]` notes and `나레이션` text.
- **Write narration for TTS**: code in Korean pronunciation (`torch.arange` →
  토치 점 어레인지, `float64` → 플로트 육십사), numbers as words. Parentheses
  are read aloud, so don't put English in them.
- Note notebook problems separately (stale outputs that no longer match the
  code, a typo like `matrix.dtype` for `tensor3d.dtype`, a line the narration
  mentions but the code lacks) — fix them before capturing.

Save it as `<lecture>/<name>_영상/대본.md`.

## 2. Audio — the person makes it

Recommend the ElevenLabs **web UI, one file per scene**, over the API: same
model, but listening and regenerating a bad take is easier there, and effects
are done in Remotion anyway. One voice and the same stability/similarity for
every scene. Files arrive as `audio/NN_Chapter_M.mp3` (00 = S01); any names
work, the spec maps scene → file.

## 3. Capture in Colab (Claude in Chrome)

Work folder: `<lecture>/<name>_영상/` with `images/`, `audio/`. Copy
`capture.ps1` there. The notebook usually lives in a Google Drive–synced
folder; find its Drive id (Drive connector `search_files`) and open
`colab.research.google.com/drive/<id>` in a new tab.

1. Edit the notebook file locally (back it up first), wait for Drive sync
   (`modifiedTime` updates), then open it and **Run all** (`ctrl+F9`). Check the
   outputs match the edited code.
2. Make the frame 16:9 4K: `capture.ps1 -Keys '{F11}'` (fullscreen), then
   `-Keys '^{ADD}'` ×4 (zoom 175%, readable code). On a 3840×2160 / 150% screen
   that gives a 1463×823 css viewport, `devicePixelRatio` 2.625.
3. Per scene: scroll with JS (`__nbScroll(y)` from layout.js, or set
   `.notebook-container` `scrollTop`), then
   `capture.ps1 -Title <marker> -Out images\S03.png`. Record each image's
   scrollTop — the spec needs it. Reuse one image for several scenes when the
   screen doesn't change (S05 = S06 = S07). Read a few captures to check.

**Pitfalls (all hit on the first run):**
- **A screen recorder's overlay (GOM Cam) dims the whole screen** in
  CopyFromScreen captures. `capture.ps1` uses PrintWindow on the Chrome window,
  so overlays don't matter — keep it that way.
- **The visible tab may not be the one you control.** If the person already
  had the notebook open, the screen shows *their* tab and your scrolls never
  appear. Set `document.title = 'CAPTURE_TAB'` in your tab, then cycle
  `ctrl+1..9` with SendKeys until the window title contains it. Pass
  `-Title CAPTURE_TAB` from then on. Warn the person: their old tab holds the
  pre-edit notebook and saving from it would overwrite the fix.
- **"…디버깅을 시작함" infobar** appears at the top after each extension call
  and shifts the page; `capture.ps1` waits until it's gone.
- **A `#scrollTo=` hash makes Colab jump back** on resize. Clear it:
  `history.replaceState(null, '', location.pathname)`.
- Clicking a cell leaves a selection outline and toolbar in the capture; S01 is
  the one place that's usually visible. Fine to leave.
- Leave Chrome as you found it at the end or tell the person: F11, Ctrl+0.

## 4. Measure the layout

Paste `layout.js` into `javascript_tool`, then `await __nbLayout()` and read
`__nbChunk(0, 800)`, `__nbChunk(1, 800)`, … until empty — the tool truncates
around 1,000 characters, sooner with Korean, so keep chunks at 800. Join them
into `<work>/layout.json`. It holds, per cell, in css px at scroll 0: code first
line top / line height / text left / char width, every non-empty output line
(top, left, right, height), and markdown blocks measured by their text extent.

Never eyeball box coordinates off a screenshot — measure. A char width that
comes out odd for one cell (10.5 instead of 7) means Monaco hadn't finished
drawing it; `build_scenes.py` uses the median across cells.

## 5. Beat times

```
python notebook/pauses.py <work>/audio
```
Each line lists `time(pause)` where speech resumes; `*` marks pauses ≥ 0.6s,
which are usually sentence ends. Walk the scene's sentences in order against
those marks — a beat starts when its sentence starts. Commas give shorter
pauses; use sentence length (syllables ≈ 6–7/s) to pick between candidates.
This lands within ~0.5s. (With an ElevenLabs key, Scribe word timestamps —
SKILL.md, Highlights — are exact.)

## 6. Scene spec

`<work>/scenes.json` (paths relative to it):
```json
{
 "id": "01_tensor",
 "title": "03강 텐서(Tensor)",
 "notebook": "../01_tensor.ipynb", "layout": "layout.json",
 "imageDir": "images", "audioDir": "audio",
 "captures": {"S01": 0, "S03": 933, "S10": 3106},
 "summary": ["텐서 = 다차원 배열", "..."], "thanksAt": 11.24,
 "scenes": [
  {"id": "S03", "audio": "02_Chapter_3.mp3", "image": "S03", "beats": [
   {"t": 0, "caption": "import torch", "boxes": [{"code": [3, 1]}]},
   {"t": 22.78, "caption": "스칼라 · 벡터 · 행렬", "boxes": [{"code": [3, 5]}, {"code": [3, 12]}]},
   {"t": 12.39, "caption": "a[0, 1] → 2", "boxes": [{"code": [9, 4]}, {"out": [9, 1]}], "image": "S10"},
   {"t": 0, "caption": "실행 결과", "boxes": [{"out": [3, 1, 19]}], "zoom": false}]}
 ]
}
```
- Boxes: `{"code": [cell, first, last]}` code lines (1-based, cell index as in
  the notebook), `{"out": [cell, first, last]}` output lines counting non-empty
  lines only, `{"md": [cell, first, last]}` markdown blocks in layout order,
  `{"px": [x1, y1, x2, y2]}` raw capture pixels (diagram parts in an image).
- A beat may switch `image` — e.g. narration about results while the code
  capture can't show the output. Boxes resolve against that image's scrollTop.
- `zoom: false` for overview beats (whole cell/output); otherwise the camera
  zooms toward the boxes (up to 2×, sharp because captures are 4K).
- Captions: the point of the sentence in a few words, with code where it helps
  (`a[1:2, :2] → 1행의 0열·1열 = [4, 5]`). Not full subtitles.
- `summary` puts a recap card on the last scene; `thanksAt` (seconds into the
  last scene) shows "감사합니다".

```
python notebook/build_scenes.py <work>/scenes.json --remotion <project>
```

## 7. Remotion project

**Use an ASCII path** (e.g. `D:\WORK\remotion-lecture`). Under a Korean path
npm crashes installing esbuild (`3221225477`) and node segfaults in Git Bash.
Don't put it inside the Drive-synced lecture folder (node_modules would sync).
```
npm i remotion@4 @remotion/cli@4 react@18.3.1 react-dom@18.3.1 typescript@5 @types/react@18
cp -r notebook/template <project>/src/notebook
```
`src/index.ts` → `registerRoot(RemotionRoot)`; `src/Root.tsx`:
```tsx
import tensor01 from "./data/01_tensor.json";
import { NotebookCompositions } from "./notebook/NotebookCompositions";
import { NotebookLecture } from "./notebook/types";

export const RemotionRoot: React.FC = () => (
  <NotebookCompositions lectures={[tensor01 as NotebookLecture]} />
);
```
It registers `Notebook-<id>` (the video) and `NotebookPreview-<id>` (one frame
per beat) for each lecture; `_` in ids becomes `-`. tsconfig needs
`resolveJsonModule`. Captions use Malgun Gothic.

## 8. Proofs — stop here for approval

```
python notebook/proof_beats.py --remotion <project> --id 01_tensor --out "<work>/강조_미리보기"
```
Writes `S03-4.jpg` per beat and `sheet_NN.png`. Read every sheet yourself
first and fix what you see (boxes off, captions covering a box, zoom too weak),
then send the sheets and **wait** for the person's yes or their notes by beat
number ("S05-4 자막을 …"). Captions pick bottom / top / middle by whichever
covers the boxes least; a beat whose boxes span top and bottom lands in the
middle.

## 9. Render and add the narration

```
npx remotion render src/index.ts Notebook-01-tensor out/video.mp4 --codec=h264 --crf=18
python notebook/mux_audio.py --remotion <project> --id 01_tensor out/video.mp4 "<work>/03강_01_tensor.mp4"
```
The template has no `<Audio>`: Remotion fetches audio from
`http://localhost:3000` in node, which resolved to `::1` and failed on this
machine (`ECONNREFUSED ::1:3000`) even with `--muted` and
`NODE_OPTIONS=--dns-result-order=ipv4first`. Muxing afterwards with ffmpeg is
exact because scene lengths are computed the same way (`duration + 0.6s`,
ceil to frames) in `types.ts` and `mux_audio.py` — change both together.

Check the result: `ffprobe` durations of both streams match, `volumedetect`
shows audio, and pull 3–4 frames with `ffmpeg -ss <t>` to look at. Say plainly
that beat timing was checked from pauses, not by watching the whole video.
