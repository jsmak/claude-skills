---
name: lecture-slides
description: >-
  Build a Korean in-house lecture (딥러닝 강의 style) from the lecturer's drafts:
  a Slides artifact deck with speaker notes, a polished final script, an
  ElevenLabs phonetic script (소리 나는 대로 + break tags), and — when the lecture
  has a practice notebook — a renamed, cleaned .ipynb pushed to the course
  GitHub repo with a Colab badge and README row. Use when the user hands over
  "대본 초안", "PPT 초안", "슬라이드 초안" or an .ipynb for the next lecture
  ("N강을 만들려고 합니다", "슬라이드와 대본을 만들어 주세요", "최종 대본과
  일레븐랩스 대본", "슬라이드를 이전 스타일과 유지되도록"), or asks to revise a
  lecture deck, sync notes with a reviewed script, or add figures/formula
  images to a lecture slide. The narrated video itself is the lecture-video
  skill's job.
license: MIT
---

# Lecture Slides

Turns a lecturer's rough drafts into four deliverables that stay in sync:

| Deliverable | Where |
|---|---|
| Slide deck (Slides artifact, one `<aside>` of notes per slide) | claude.ai artifact |
| `N강_최종대본.txt` — final script, `N페이지` + `코드 N` sections | lecture folder |
| `N강_일레븐랩스_PPT.txt`, `N강_일레븐랩스_코드.txt` — TTS scripts | lecture folder |
| `NN_topic/NN_topic.ipynb` + README row | course GitHub repo |

The look, the slide recipes, the script rules and the notebook rules are in
the reference files. Read the one you need before starting that step:

- `reference/style.md` — palette, type scale, slide archetypes, layout budget
- `reference/slides-howto.md` — artifact mechanics, diagrams, images, revising
- `reference/script.md` — polishing the draft, final script format, ElevenLabs rules
- `reference/notebook.md` — notebook conventions, local run, Colab check, GitHub
- `templates/*.html` — copy-ready slide files for each archetype

## Workflow

1. **Read everything first.** The script draft (`N강 대본 초안.txt`), the PPT
   draft (export to PNG to look at it — `reference/slides-howto.md`), any
   images in the folder or `backup/`, and the notebook. Drafts may be
   mojibake in the first half and clean UTF-8 later; find the readable copy.
2. **Ask only what changes the work** (one AskUserQuestion, ≤3 questions):
   - notebook folder/file name (`NN_topic/NN_topic.ipynb`, recommend one),
   - the user's own figures: redraw in deck style, or insert as images
     (if the user drew a figure carefully, inserting it is usually right —
     see "Lessons"),
   - anything the draft leaves open (which experiments, who writes a
     missing script section).
   Everything else: decide, state the assumption in one line, go.
3. **Notebook** (if any) → `reference/notebook.md`: rename, format like the
   previous lecture, fix wrong comments, run locally, push, README row.
   Get the numbers the script will quote from the run.
4. **Deck** → `reference/slides-howto.md` + `reference/style.md`: one idea
   per slide, notes = the polished script for that page, citations for
   paper figures, a closing "코랩에서 직접 실행" slide with the notebook URL
   when there is a notebook.
5. **Scripts** → `reference/script.md`: the review draft first
   (`N강_대본.txt` or `N강_코드대본.txt`) when the user wants to review; the
   final script and ElevenLabs files once they have reviewed.
6. **Report**: what changed, the numbers used and where they came from, and a
   short "확인해 주세요" list (factual fixes you made to their wording,
   pronunciations you guessed, anything not verified). Never claim a render
   or a Colab run you did not do.

## Rules that came from the user

- **Commit/push only when asked**; the user asks explicitly ("올리고 확인",
  "깃허브에 올려줘"). Never delete their files; keep originals beside the
  renamed copy.
- **Their edits win.** The deck is edited in the browser and sometimes in a
  downloaded PPTX. Before touching a slide, read its current version from the
  artifact; change only what was asked; keep their widths, wording, images.
- **Numbers follow Colab**, because the video is recorded on Colab. If you
  only ran locally, say so and round ("약 0.29").
- **The last code scene ends with the next-lecture line** ("다음 시간에는 …
  살펴보겠습니다."), then "감사합니다." Ask or leave a placeholder if the next
  topic is unknown.
- Korean throughout, polite 합니다체 in scripts; slides use short noun-phrase
  or 다/음 endings.

## Lessons

- A redrawn diagram can lose what the user's figure showed (lecture 8: the
  residual-connection backprop flow). When the user supplies a careful
  figure, insert it (upload as asset) and put short takeaway cards beside it.
- Formula images the user pastes (PNG of LaTeX) go in a white card
  (`background:#FFFFFF`) at native size — scaling up blurs them.
- When the user's wording is technically wrong (e.g. "squaring the gradient =
  second derivative", "Wide ↔ Deep inputs swapped"), fix it in the script and
  list it under "확인해 주세요"; do not silently keep or silently change.
- Verify every quoted number against the notebook output; compute any
  derived claim (e.g. "baseline loss equals predicting the mean") before
  saying it.
