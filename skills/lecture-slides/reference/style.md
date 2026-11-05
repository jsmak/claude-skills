# Deck style (딥러닝 강의 시리즈)

All decks in the series share this look. Do not invent a new palette per
lecture; consistency across lectures is the point.

## Fonts (deck.json `faces`)

```json
"faces":{
 "noto-sans-kr":{"family":"Noto Sans KR","href":"https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"},
 "poppins":{"family":"Poppins","href":"https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap"},
 "jetbrains-mono":{"family":"JetBrains Mono","href":"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap"}}
```

- Body/headings: `'Noto Sans KR', Arial, sans-serif`
- Eyebrows, big numbers, English labels: `'Poppins', 'Noto Sans KR', sans-serif`
- Code, API names, URLs: `'JetBrains Mono', 'Courier New', monospace`

## Palette

| Role | Hex |
|---|---|
| Dark (text, dark slides, dark bands) | `#2E3440` |
| Light background | `#F7F8FB` |
| Card | `#FDFDFF`, border `2px solid #E3E6EE` |
| Blue accent (eyebrow, titles in cards) | `#3A6FD8`; light `#EEF3FD`; mid `#C9DAF8`, `#8DB4F5` |
| Orange accent | `#F5A623` fill; text on light `#A35F00`; light fill `#FFF4E2` |
| Purple (shared/merge parts) | `#6B5FC7`; light `#EEECFA` |
| Muted text | `#545B6B`, `#6A7180`; lines `#AEB4C2` |
| On dark: card `#3B4252`, muted `#C9CED8`, eyebrow `#4A8AE8` |

Color meaning stays fixed inside a lecture (e.g. lecture 8: blue = Deep path,
orange = Wide path, purple = shared trunk).

## Type scale

| Use | Size |
|---|---|
| Cover title | 96–120px, 700 |
| Slide title `<h2>` | 60px, 700, line-height 1.15 |
| Eyebrow | 24px Poppins 600, letter-spacing 3px, `#3A6FD8` |
| Card title | 28–34px, 700 |
| Body in cards | 26–28px, line-height 1.45–1.55 |
| Smallest (labels, footers) | 24px — never below |

## Slide archetypes (see `templates/`)

- **cover** — dark `#2E3440`, eyebrow `LECTURE 0N`, h1, subtitle, pills or a
  mono line of API names, a simple SVG motif pinned right
  (`left:1120–1200px; top:260–300px; ~560px`).
- **content** — light bg, heading block (eyebrow + h2), 2–4 cards in a row,
  then one dark band (`#2E3440`, icon + one sentence, often the notebook
  result: "노트북: 테스트 손실 0.57 → **0.42**").
- **statement** — blue `#3A6FD8` or dark background, one large quote or word,
  one light card underneath. Use once or twice per deck.
- **diagram** — pinned boxes (`position:absolute`) + `<x-connector>`s on
  three rows (`top: 300 / 480 / 660`, height ~124) and up to 7 columns
  (`left: 128, 358, 588, 818, 1048, 1278, 1508`, width 190). Legend in an
  empty area. Dashed connectors for backward/gradient flow.
- **comparison** — two cards side by side (일반 vs 잔차, 영어 vs 코딩, 방법 1 vs 2).
- **paper figure** — figure card on the left (white bg, padding 12) +
  takeaway cards on the right + citation footer.
- **colab** — dark, three numbered step cards (저장소 열기 → Open in Colab →
  런타임 › 모두 실행), a "what to check" box, and a "노트북 주소" row with
  the full GitHub URL as a link.
- **closing** — dark, eyebrow, big two-line h1, thanks line in orange, the
  cover motif repeated on the right.

## Layout budget

- Canvas 1920×1080, `padding:128px` → 1664×824 inside. With a footer:
  `padding:128px 128px 160px` and one pinned 24px row at `bottom:64px`.
- Heading block ≈ 100px. Leave ≥32px gaps.
- Card height ≈ lines × size × line-height + padding; check the sum fits.
- Text wraps only at spaces: box width ≥ 0.6 × font-size × longest word
  (Korean ≈ 1 × font-size per syllable).
- Arrows: `x-shape arrow-right/down` near 2:1; long horizontal arrows look
  wrong — restructure into a column + one tall merge box instead.
- Citation footer format:
  `출처: Kaiming He et al. (2015), Deep Residual Learning for Image Recognition · <a href="https://arxiv.org/abs/1512.03385">arxiv.org/abs/1512.03385</a>`
