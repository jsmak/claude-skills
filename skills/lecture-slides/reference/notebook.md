# Practice notebook

Course repo: `jsmak/dl-framework` (clone into the scratchpad). One folder
per lecture: `NN_topic/NN_topic.ipynb` (e.g. `06_mlp_regression`,
`07_optimization`, `08_multi_io_model`). Keep the user's original notebook
untouched next to the renamed copy.

## Format (copy the previous lecture's notebook)

1. Cell 0 — Colab badge:
   `<a href="https://colab.research.google.com/github/jsmak/dl-framework/blob/main/NN_topic/NN_topic.ipynb" target="_parent"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>`
2. Cell 1 — `# **N강 제목**`, one-line summary, how it continues the previous
   lecture, numbered list of what the notebook covers. Markdown line breaks
   need two trailing spaces (the user adds them; keep them).
3. `## **1. 실습 준비**` — install cell:
   ```
   %pip install -q torchviz
   #!wget -q -nc https://raw.githubusercontent.com/jsmak/dl-framework/main/06_mlp_regression/cal_housing_py3.pkz
   ```
4. Data load — default download active, offline fallback commented:
   ```python
   housing = fetch_california_housing() # 방화벽 등으로 데이터를 받을 수 없으면 이 줄을 주석 처리하고 아래 줄을 실행하세요.
   # housing = fetch_california_housing(data_home='./', download_if_missing=False)
   ```
5. Sections `## **2. …**`, each with a short markdown cell above the code;
   final section is the computation graph (torchviz `make_dot`) with the
   color legend (초록 손실 · 회색 연산 · 파란 파라미터).

Fix wrong comments and stale markdown (names that don't exist in the code,
wrong sizes, wrong years) and report them. Do not change the experiment
unless asked; if an experiment doesn't show its effect, propose a redesign
and ask.

A generator script (`mkN.py` in the scratchpad) that reads the user's
notebook and writes the formatted one keeps the edits reproducible.

## Run locally

```bash
P=/c/Users/JS/AppData/Local/Programs/Python/Python312/python.exe   # torch CPU
$P -m jupyter nbconvert --to notebook --execute --inplace NN_topic.ipynb
```

Print outputs with `sys.stdout.reconfigure(encoding='utf-8')` (cp1252
console). Clear the `%pip` cell's outputs before pushing (local pip notices).

## Colab check (when asked to "확인")

In Claude in Chrome: open the badge URL → 수정 › 모든 출력 지우기 → Ctrl+F9 →
accept "Google에서 작성하지 않았습니다" with "무시하고 계속하기". A run whose
dialog wasn't accepted shows the old saved outputs — clear first. Outputs
render in iframes; read them with zoomed screenshots. Update slide/script
numbers to the Colab values.

## Push (only when asked)

- Copy the notebook into the clone, add/replace the README 목차 row:
  `| N강 | 주제 — 한 줄 설명 | [NN_topic.ipynb](NN_topic/NN_topic.ipynb) [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jsmak/dl-framework/blob/main/NN_topic/NN_topic.ipynb) |`
  (replace the matching "예정 | …" row).
- Commit message style: `feat: N강 … 노트북 추가` / `docs: N강 노트북 …`,
  ending with the attribution line the session gives.
- The deck's closing slide links
  `https://github.com/jsmak/dl-framework/blob/main/NN_topic/NN_topic.ipynb`.
