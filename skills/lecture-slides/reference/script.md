# Scripts

## Polishing the draft

- Keep the lecturer's voice, analogies and order. Fix typos, doubled phrases,
  broken sentences ("수백만 개의 파라미터를 매개변수 공간은" → "수백만 개의
  파라미터로 이루어진 매개변수 공간은").
- One sentence per line. 합니다체.
- Fix factual errors and list each under "확인해 주세요" in the report
  (lecture 7: squaring the gradient is not a second derivative; lecture 8:
  Wide/Deep inputs were swapped vs the code; lecture 9: "트랜스포머 10년이
  넘어" → "10년 가까이").
- Never invent statistics or quotes. Numbers in code scenes come from the
  notebook output (Colab run preferred), rounded the way the lecturer speaks
  ("약 0.29", "0.57에서 0.42로").
- A missing section (e.g. no code script) is written from the notebook,
  cell by cell, as `코드 1 … 코드 N`: what the cell does, what to look at in
  the output, what it means. End with a recap and the next-lecture line.

## Final script file — `N강_최종대본.txt`

```
N강 최종 대본 (슬라이드 1~K페이지 + 코드 1~M)
- 일레븐랩스에는 N강_일레븐랩스_PPT.txt, N강_일레븐랩스_코드.txt를 넣으세요.

==============================
슬라이드
==============================

1페이지
안녕하세요.
…

==============================
코드
==============================

코드 1
노트북이 열렸습니다.
…
```

A review draft before the final uses the same layout (`N강_대본.txt` or
`N강_코드대본.txt`) with a header line saying it is for review.

## ElevenLabs files — `N강_일레븐랩스_PPT.txt` / `_코드.txt`

Same page/scene headings, no header block. Each sentence ends with a break
tag:

- `<break time="0.5s" />` after a normal sentence
- `<break time="0.3s" />` at a comma inside a long sentence, or between two
  short sentences on one line
- `<break time="1.0s" />` at the end of a page/scene
- `<break time="0.8s" />` after the opening line ("노트북이 열렸습니다.") and
  before the final farewell
- The very last "감사합니다." has no tag.

Write everything as it is spoken:

| Written | Spoken |
|---|---|
| 0.57 / 0.0023 / 1.31 | 영 점 오칠 / 영 점 영영이삼 / 일 점 삼일 |
| 16512 / 4128 / 1,520 / 10,000 | 만 육천오백십이 / 사천백이십팔 / 천오백이십 / 만 |
| 87% / 2016년 / 5강 / 100층 | 팔십칠 퍼센트 / 이천십육 년 / 오 강 / 백 층 |
| SGD, RMSProp, AdamW, L1/L2 | 에스지디, 알엠에스프롭, 아담더블유, 엘원/엘투 |
| MSE, BCE, RMSE, CNN, RNN, LLM | 엠에스이, 비씨이, 알엠에스이, 씨엔엔, 알엔엔, 엘엘엠 |
| ReLU, GELU, Swish, tanh, He 초기화 | 렐루, 젤루, 스위시, 탄에이치, 허 초기화 |
| model.train / model.eval / torch.no_grad | 모델 점 트레인 / 모델 점 이밸 / 토치 점 노 그래드 |
| torch.cat, nn.Linear, weight_decay | 토치 점 캣, 엔엔 점 리니어, 웨이트 디케이 |
| fetch_california_housing, cal_housing_py3.pkz | 페치 캘리포니아 하우징, 캘 하우징 파이 쓰리 점 피케이지 |
| torchviz, wget, named_parameters | 토치비즈, 더블유겟, 네임드 파라미터스 |
| x + F(x), 1 + F'(x), σ(z) − y | 엑스 더하기 에프 엑스, 일 더하기 에프 프라임 엑스, 시그마 제트 빼기 와이 |
| dl-framework, Open in Colab | 디엘 프레임워크, 오픈 인 코랩 |
| AI, CM/KPI/PM/QCI, AICE | 에이아이, 씨엠/케이피아이/피엠/큐씨아이, 에이스 |
| EfficientNet, Chinchilla, Optuna, Ray Tune | 이피션트넷, 친칠라, 옵투나, 레이 튠 |
| Garbage In, Garbage Out | 가비지 인, 가비지 아웃 |

Flag guessed pronunciations (feature names like MedInc → 메드인크) in the
report so the lecturer can swap in Korean words.

## Closing lines

- Code lecture: recap the experiments, then "다음 시간에는 … 살펴보겠습니다." +
  "감사합니다."
- Last code lecture: "이번 강의로 코드 실습은 모두 마칩니다." + a one-line
  list of what the course covered + "다음 시간에는 지금까지 배운 내용을
  정리하면서 과정을 마무리하겠습니다."
