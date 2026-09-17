---
name: lecture-video
description: >-
  Turn a folder of {slide deck PDF/PPTX, per-page script .txt, per-page
  narration .wav} into a narrated lecture .mp4 with Remotion - Ken Burns
  motion per slide, animated slide transitions (push/zoom/wipe/crossfade), an
  intro title card, light or dark theming to match the deck, a progress bar, a
  page counter, optional word-synced highlight boxes, and animated GIFs split
  into frames and played in step with the narration. Use when the user hands
  you a lecture folder (a deck plus N pairs of
  "<n>페이지.txt"/"<n>페이지.wav") and asks for a video, or asks to add
  transition animations, narration-synced highlights on code/diagram slides,
  or a narration-synced GIF animation to a slide-based lecture video.
license: MIT
---

# Lecture Video

Assembles a slide deck plus per-page narration into an mp4 using Remotion.
`template/` in this skill folder is a drop-in, config-driven Remotion module
(no per-lecture file copying or editing needed) — `theme.ts`,
`transitions.ts`, `Highlight.tsx`, `highlightCues.ts`, `FrameSequence.tsx`,
`IntroCard.tsx`, `Slide.tsx`, `ProgressBar.tsx`, `LectureComposition.tsx` (exports
`createLectureComposition(config)` and `createLectureMetadataCalculator(config)`
factories). If the project's `src/lecture` predates a template file, copy the
missing file over before using it.

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
     // frameSequencesBySlide: { 4: [{ dir, ext, frameCount, xPct, ..., segments }] },
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

5. **(Optional) Narration-synced highlight boxes** — see the Highlights
   section below. Only when the user asks. Worth *offering* when one slide
   runs several minutes of narration (a 5-10 min static slide is the case
   this was built for), but don't add them speculatively. "Highlight the
   code pages" means every slide the narration walks through code on, plus
   the diagram/formula each code line maps to.

5b. **(Optional) Animated GIF on a slide** — see Animated GIFs below. A deck
   exported to PDF only keeps a GIF's first frame (often blank), so a GIF
   the user points to has to be split and placed back over its slot.

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
  coordinates come from `grid_crop.py` instead.
- **Decks can mix dark and light slides.** Sample the corners of *every*
  slide, not just slide 1. For a mixed deck, match the intro card `bg` to
  slide 1 (it hands off to it), and pick an accent and counter chip that
  read on both backgrounds (a mid-saturation blue plus a semi-opaque dark
  chip with light text works on white and on dark).
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
- **Don't eyeball code-line highlight coordinates — measure them.** Code
  lines in these decks are only ~7-9px apart at 2880px. With the default
  10px pad a box always strikes through the neighboring line; nudging by eye
  just moves the strike-through from the comment above onto the code line
  itself (both happened on lecture 8). Get exact line bands with
  `helpers/text_bands.py`, use them as-is for y0/y1, and put code regions in
  their own `defineHighlightRegions(..., 4)` set. Keep diagram blocks (which
  have open space around them) in a separate set with the default pad.
- **Keep a slide's last cue ending before its exit transition** — at least
  `TRANSITION_FRAMES` (0.67s) before the slide's audio ends, or the box is
  still fading while the slide pushes away.
- **Adding highlights after starting a full render means restarting it.**
  Stop the background render task, then kill the orphaned Remotion browsers
  it leaves behind (`taskkill //F //IM chrome-headless-shell.exe` on Windows)
  before starting stills or a new render — otherwise they compete for CPU.
- **Check slide aspect ratio before assuming 1920x1080 `object-fit: cover`
  needs no thought.** The reference deck was 1280x720 (16:9) → rendered at
  2x zoom = 2561x1440, which maps to 1920x1080 with essentially no crop
  since the aspect ratios are near-identical. A deck with a different aspect
  ratio needs the math re-checked (crop amount, letterboxing) before
  trusting `object-fit: cover` to behave the same way.

## Highlights

Glowing boxes that appear over a region of a slide while the narration is
talking about it, and follow the Ken Burns zoom/pan. The work is: find *when*
from the transcript, find *where* from the slide, pair them.

**1. Transcribe the page's existing wav** (no re-generation, no splitting):
```
export PYTHONIOENCODING=utf-8
python ~/Developer/video-use/helpers/transcribe.py "public/<lectureId>/audio/page_01.wav" --language ko
```
Needs a valid `ELEVENLABS_API_KEY` (`sk_...`) in `~/Developer/video-use/.env`.
Output: `public/<lectureId>/audio/edit/transcripts/page_01.json`. A 10-minute
page takes ~15s. Scribe also normalizes the phonetic TTS script back to real
spelling (엘엘엠 → LLM, 이천 십칠년 → 2017년), so read the transcript, not the
`.txt` script.

**2. Read it as a timeline:**
```
python helpers/transcript_sentences.py <transcript.json> -o <scratch>/sentences.txt
python helpers/transcript_sentences.py <transcript.json> --words 144 153
```
The first gives one `[start-end] sentence` line per sentence — Read that file
and map sentences to what they're explaining. Use `--words` when one sentence
covers two regions ("4번 FFN을 거쳐 다시 5번 Add & Norm") to find the split
point. Lecture narration usually makes two passes over a dense slide (a
diagram overview, then a code walkthrough); cue both passes.

**3. Measure regions on the slide PNG** (the same `page_NN.png` in `public/`):
```
python helpers/grid_crop.py public/<lectureId>/slides/page_01.png <scratch>/grid.png X0 Y0 X1 Y1
```
Grid labels are absolute pixel coordinates of the slide PNG, so numbers read
off the crop go straight into the config. Two or three generous crops (a
diagram column, a code panel) cover a busy slide. If the pptx has real text
boxes, python-pptx shape geometry is an alternative, but slides are often
flattened images — check before relying on it.

For **code lines**, the grid is only good for x-extents. Take y from exact
text bands:
```
python helpers/text_bands.py public/<lectureId>/slides/page_02.png X0 Y0 X1 Y1
#   8: 510-536  (h 26)  gap 7px     <- one printed line = one code line
```
Scan one code column at a time (x-range covering only that panel). Pale code
colors (orange, light purple) on white need `--dark 200`; light text on a
dark panel needs `--invert`. A band that's suspiciously tall is two lines
merged by a graphic crossing the gap — split it by eye.

**4. Define regions once, cue them by name** with `defineHighlightRegions`:
```tsx
import { defineHighlightRegions } from "./lecture/highlightCues";

// pixels of the slide PNG (e.g. 2880x1620 for a --zoom 3 960x540 deck)
const p1 = defineHighlightRegions(2880, 1620, {
  diagFfn:    [105, 1000, 485, 1085],
  formulaFfn: [855, 1285, 1350, 1320],
  codeFfn:    [1480, 1317, 2340, 1350],
});

highlightsBySlide: {
  0: [
    ...p1(["diagFfn", "formulaFfn"], 144.9, 148.9),          // overview pass
    ...p1(["codeFfn", "diagFfn", "formulaFfn"], 486.2, 564.2), // code pass
  ],
},
```
Code lines go in a second set with a 4px pad (see Pitfalls), cued at the same
times as the diagram set:
```tsx
const p2code = defineHighlightRegions(2880, 1620, {
  codeFwdAttn:   [1175, 1288, 1855, 1345],   // y from text_bands.py
}, 4);

...p2code(["codeFwdAttn"], 133.3, 157.2),
...p2(["attnBox", "diagSdpa"], 133.3, 157.2),
```
Regions named in one call share the time window — that's how a code line, its
formula, and its diagram block light up together. Times are seconds within
that slide's own audio. Start a cue ~0.2s before the phrase and end ~0.2s
after, and name regions by *what they are* (`codeFwdNorm1`), not by marker
number, so the cue list reads like the lecture.

**5. Verify with stills before rendering.** Global frame =
`introFrames + sum(previous slides' frames) + sec * 30`; for slide 1 that's
`120 + sec * 30`.
```
npx remotion still <Id> <scratch>/hl_check.png --frame=<N>
```
Check 3-4 cue moments spread across the slide with the Read tool. Look
specifically at box edges against neighboring text — see Pitfalls.

## Animated GIFs

A GIF on a slide (a Google Research blog animation, a step-by-step diagram)
is split into numbered frames and scrubbed through by the narration: it plays
while the narrator describes a step, holds on that step while they explain
it, and resumes on the next step. It sits inside the Ken Burns wrapper, so it
moves with the slide.

**1. Split it and get a contact sheet:**
```
python helpers/split_gif.py "<lecture folder>/anim.gif" public/<lectureId>/gif --sheet <scratch>/sheet.png --sheet-every 40
```
Prints frame count, fps, and aspect ratio. Frames are flattened onto white
(`--bg` to change) as `frame_0000.jpg ...`. Read the sheet once: every tile
is labeled with its frame index, which is what segments use.

**2. Find the slot.** The PDF export shows the GIF's first frame — often
blank, so the slot is just an empty frame/border. Measure its *inside* with
`grid_crop.py` and inset a few px so a colored border stays visible. The
frame uses `object-fit: contain`, so a slot whose aspect matches the GIF
fills cleanly; otherwise it letterboxes on the slide background.

**3. Transcribe the page and map steps to frame ranges.** Read the sentence
timeline next to the contact sheet and pair each explained step with the
frames that show it.

**4. Configure segments** (`template/FrameSequence.tsx`):
```tsx
frameSequencesBySlide: {
  4: [{
    dir: "lecture8/gif", ext: "jpg", frameCount: 846,
    xPct: 86 / 2880, yPct: 243 / 1620, wPct: 1361 / 2880, hPct: 1201 / 1620,
    segments: [
      // overview talk before the walkthrough: show the finished result
      { startSec: 0,     endSec: 0.1,   fromFrame: 800, toFrame: 800 },
      // "순서대로 살펴보겠습니다" -> restart from the empty canvas
      { startSec: 49.0,  endSec: 52.8,  fromFrame: 0,   toFrame: 60 },
      { startSec: 52.8,  endSec: 61.5,  fromFrame: 60,  toFrame: 95 },  // step 1
      { startSec: 67.3,  endSec: 82.0,  fromFrame: 95,  toFrame: 170 }, // step 2
      // ...
      { startSec: 200.0, endSec: 216.0, fromFrame: 546, toFrame: 805 }, // last step
    ],
  }],
},
```
Semantics: before the first segment, its `fromFrame` shows; inside a segment,
frames interpolate linearly from `fromFrame` to `toFrame`; after a segment
ends, its `toFrame` holds until the next segment starts. So gaps between
segments are the pauses.

Choices that worked:
- **Don't leave the slot blank during intro talk.** If the narration talks
  about the concept before walking the animation step by step, hold on the
  finished frame first, then restart from frame 0 at the walkthrough.
- **End on a complete frame, not the GIF's last frame.** Looping GIFs often
  fade to blank at the end — stop the last segment before that (here 805 of
  846) so the closing narration has something to look at.
- **Play near real speed.** Stretching 60 GIF frames over ~4s (vs 3s native)
  reads fine; much slower than 0.5x looks stuck, and compressing a long step
  into a short phrase looks frantic — split the step instead.

**5. Verify from the final render**, not just stills: pull frames at several
segment times across the slide and put them on one sheet (crop the slot,
label with slide-relative seconds) to confirm the animation state matches
what the narration is saying at each point.

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
