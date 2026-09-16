---
name: lecture-video
description: >-
  Turn a folder of {slide deck PDF/PPTX, per-page script .txt, per-page
  narration .wav} into a narrated lecture .mp4 with Remotion - Ken Burns
  motion per slide, animated slide transitions (push/zoom/wipe/crossfade), an
  intro title card, light or dark theming to match the deck, a progress bar, a
  page counter, and optional word-synced highlight boxes. Use when the user
  hands you a lecture folder (a deck plus N pairs of
  "<n>페이지.txt"/"<n>페이지.wav") and asks for a video, or asks to add
  transition animations or narration-synced highlight effects to a
  slide-based lecture video.
license: MIT
---

# Lecture Video

Assembles a slide deck plus per-page narration into an mp4 using Remotion.
`template/` in this skill folder is a drop-in, config-driven Remotion module
(no per-lecture file copying or editing needed) — `theme.ts`, `Highlight.tsx`,
`IntroCard.tsx`, `Slide.tsx`, `ProgressBar.tsx`, `LectureComposition.tsx`
(exports `createLectureComposition(config)` and
`createLectureMetadataCalculator(config)` factories).

## Prerequisite

A Remotion project. If the user doesn't have one yet:
```
npx create-video@latest --yes --blank .
npm install @remotion/media-utils
```
Then, if `remotion.config.ts` has `Config.setRspack(true)`, remove that line
— see Pitfalls.

## Input contract

A folder (anywhere, not necessarily inside the Remotion project) containing:
- One slide deck as **PDF** (required — used to rasterize images). If the
  folder only has a `.pptx`, convert it first — PowerPoint is usually
  installed on these Windows machines, and `32` is `ppSaveAsPDF`:
  ```powershell
  $ppt = New-Object -ComObject PowerPoint.Application
  $pres = $ppt.Presentations.Open("<deck>.pptx", $true, $false, $false)
  $pres.SaveAs("<deck>.pdf", 32); $pres.Close(); $ppt.Quit()
  ```
- Per page: `<lecture>_<n>페이지.txt` (narration script, may contain
  ElevenLabs `<break time="0.Ns" />` tags — informational only, not needed
  by this pipeline) and `<lecture>_<n>페이지.wav` (that page's narration
  audio, one file per slide — do not split into per-paragraph files, see
  Pitfalls).

Confirm the page count matches between the PDF and the wav files before
starting.

## Pipeline

1. **Copy this skill's `template/` into the Remotion project**, once per
   project (not per lecture):
   ```
   cp -r template <remotion-project>/src/lecture
   ```

2. **Extract slide images.** Aim for roughly 1.5x the output width so the Ken
   Burns zoom never upscales — check what you got and bump `--zoom` if the
   deck's PDF pages are small (a 960x540pt deck needs `--zoom 3`, a
   1280x720pt one is fine at the default 2):
   ```
   python helpers/extract_slides.py "<deck>.pdf" "<scratch>/slides" [--zoom 3]
   ```

3. **Stage assets into the Remotion project + get durations**:
   ```
   python helpers/setup_assets.py \
     --slides-dir "<scratch>/slides" \
     --source-dir "<lecture folder>" \
     --wav-glob "<lecture>_{n}페이지.wav" \
     --page-count <N> \
     --dest "<remotion-project>/public/<lectureId>"
   ```
   This renames everything to ASCII `page_01.png` / `page_01.wav` — see
   Pitfalls for why that matters on Windows.

4. **Register the lecture** in the Remotion project's `src/Root.tsx`:
   ```tsx
   import {
     createLectureComposition,
     createLectureMetadataCalculator,
     LectureConfig,
   } from "./lecture/LectureComposition";
   import { FPS, HEIGHT, WIDTH } from "./lecture/theme";

   const myLectureConfig: LectureConfig = {
     lectureDir: "lectureId",       // matches public/<lectureId>
     pageCount: 11,
     introTopLabel: "SERIES LABEL",
     introTitleMain: "메인 타이틀",
     introTitleSub: "부제목",
     // theme: LIGHT_THEME,         // white decks; omit for dark ones
     // transitions: "crossfade",   // or ["pushLeft", "zoomIn", ...]; omit for the varied default
     // highlightsBySlide: { 0: [{ xPct, yPct, wPct, hPct, startSec, endSec }] },
   };

   <Composition
     id="MyLecture"
     component={createLectureComposition(myLectureConfig)}
     calculateMetadata={createLectureMetadataCalculator(myLectureConfig)}
     fps={FPS} width={WIDTH} height={HEIGHT}
     durationInFrames={30 * FPS}
     defaultProps={{ slideFrames: [], audioStarts: [] }}
   />
   ```
   No file copying per lecture — just a new config object and a new
   `<Composition>` registration. Multiple lectures can coexist in one
   Remotion project this way.

5. **(Optional) Word-synced highlight boxes.** Only do this if the user
   asks for it — it's manual, per-slide work, not something to do
   speculatively for every page.
   - Get word-level timestamps by transcribing the *existing* wav (no need
     to regenerate audio, and no need for per-paragraph files — a whole
     page's audio transcribes fine in one shot). The
     [video-use](https://github.com/browser-use/video-use) skill's
     `helpers/transcribe.py` does this via ElevenLabs Scribe:
     ```
     export PYTHONIOENCODING=utf-8   # required on Windows, see Pitfalls
     python ~/Developer/video-use/helpers/transcribe.py "public/<lectureId>/audio/page_01.wav" --language ko
     ```
     Requires a valid `ELEVENLABS_API_KEY` in `~/Developer/video-use/.env`
     (`sk_...`, verify with
     `curl -H "xi-api-key: $KEY" https://api.elevenlabs.io/v1/user` → 200).
     Output lands in `.../audio/edit/transcripts/page_01.json`, a `words`
     array of `{text, start, end, type}` in seconds.
   - Find the narration phrase that matches what you want to highlight.
     **The spoken narration is usually a paraphrase of the on-slide text,
     not a verbatim match** — search the transcript's `text` field by
     eye/keyword, don't try exact string-matching against the slide.
   - Find the on-screen pixel box for that content. If the source pptx has
     real text boxes (check `python-pptx`: `shape.has_text_frame` /
     `shape.shape_type` — see Pitfalls), read positions straight off the
     shape geometry. If the slide is a flattened image (every shape is
     `PICTURE`), crop-and-view the region with PIL + the Read tool to
     eyeball pixel bounds:
     ```python
     from PIL import Image
     Image.open("page_01.png").crop((x0, y0, x1, y1)).save("check.png")
     ```
   - Add a `HighlightCue` to `highlightsBySlide` in the config:
     `{xPct, yPct, wPct, hPct, startSec, endSec}` — percentages of the full
     slide image, `startSec`/`endSec` relative to that slide's own audio.

6. **Preview before full render.** Render a short frame range first
   (`npx remotion render <Id> out/preview.mp4 --frames=0-400`), pull a still
   with `ffmpeg -ss <t> -i out/preview.mp4 -frames:v 1 check.png` and view it
   with Read, before committing to a full 10-20 min render.

7. **Full render**: `npx remotion render <Id> "out/<title>.mp4"`.

## Pitfalls (all hit and fixed once already — don't rediscover them)

- **`Config.setRspack(true)` in `remotion.config.ts` silently breaks
  rendering on Windows** — bundling reports success but `bundle.js` never
  gets written, and render fails with an ENOENT reading a source map. Keep
  the default webpack bundler; do not re-enable rspack.
- **Windows console is cp1252, not UTF-8.** Any Python script that prints
  Korean text (filenames, transcript content) crashes with
  `UnicodeEncodeError` unless `PYTHONIOENCODING=utf-8` is exported first, or
  unless you avoid printing Korean text at all. This is *why*
  `setup_assets.py` renames everything to ASCII `page_NN.*` immediately —
  sidesteps the problem for every downstream step, not just this one.
- **Slide decks generated by an image tool (NotebookLM-style AI slide
  generators, screenshots, etc.) have no extractable text layer.** Check
  with `python-pptx` early: `shape.has_text_frame` / `shape.shape_type` — if
  every shape is `PICTURE`, there is no shape geometry to read, and highlight
  coordinates must be found by visual inspection instead of automated
  extraction. If the user is designing new slides and wants automatable
  highlights, tell them to build with real PowerPoint text boxes, not
  pasted-in images.
- **Audio must be wrapped in its own `<Sequence from durationInFrames
  layout="none">`** inside each Slide component. Without it, `<Audio>`
  plays from the timeline's global frame 0, not from when that slide
  actually starts — badly desynced narration.
- **A highlight overlay must be a sibling of the `<Img>` inside the SAME
  transformed wrapper**, positioned with `%`-based `left/top/width/height`.
  If it's positioned independently with its own absolute coordinates, it
  will drift away from its target as the Ken Burns zoom/pan animates the
  image underneath it.
- **ElevenLabs API keys are account-wide, not a separate purchase.** One key
  covers TTS and Speech-to-Text (Scribe) alike, drawing from the same
  monthly credit pool as whatever paid plan is already active. No need to
  buy anything extra to use Scribe for the highlight-cue workflow above.
- **Don't split narration into per-paragraph wav files.** It doesn't help
  timestamp precision (whole-page transcription already gives word-level
  timestamps) and adds real risk: re-stitched pauses sound unnatural and
  splice points can pop.
- **Check slide aspect ratio before assuming 1920x1080 `object-fit: cover`
  needs no thought.** The reference deck was 1280x720 (16:9) → rendered at
  2x zoom = 2561x1440, which maps to 1920x1080 with essentially no crop
  since the aspect ratios are near-identical. A deck with a different aspect
  ratio needs the math re-checked (crop amount, letterboxing) before
  trusting `object-fit: cover` to behave the same way.

## Themes

`template/theme.ts` ships two palettes, picked per lecture via
`config.theme` (merged over `DARK_THEME`, so a partial override works too):

- `DARK_THEME` (default) — dark navy bg `#1c2230`, muted gold accent, for
  decks on a dark background.
- `LIGHT_THEME` — white bg, orange accent `#e8871e`, dark navy title, for
  decks on a white background.

**Match the palette to the deck**, not to the previous lecture — the intro
card background, progress bar, and page-counter chip all sit against the
deck's own slides, so a dark card in front of a white deck reads as a
mistake. Sample the deck's real accent color (probe a few pixels of an
arrow/heading with PIL) rather than guessing. Keeping `introTopLabel`
identical across a series is what ties the lectures together visually.

## Transitions

`config.transitions` controls how each slide enters: one type for all, an
array for per-slide control, or omit it for the default varied rotation
(`pushLeft → zoomIn → wipeRight → pushUp`, cycling). Types live in
`template/transitions.ts`: `crossfade`, `pushLeft`, `pushUp`, `zoomIn`,
`wipeRight`.

The outgoing slide's exit is driven by the *incoming* slide's transition, so
a push moves both slides together as one shove instead of a dissolve. Slide 1
always crossfades in from the intro card, and the last slide always fades to
black — those two are not configurable. Motion runs 20 frames (0.67s);
shorter than ~15 and a push stops reading as motion.

## Other style defaults

~4s intro card, subtle Ken Burns (scale 1 → 1.07, ±16px pan, alternating
direction per slide), thin accent progress bar pinned to the bottom edge,
"NN / total" page counter bottom-right, Arial throughout.
