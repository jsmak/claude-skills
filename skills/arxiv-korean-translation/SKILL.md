---
name: arxiv-korean-translation
description: >-
  arXiv 논문 링크나 ID를 받아 Abstract부터 Conclusion까지 한국어(경어체)로 전문 번역해
  마크다운 파일로 저장합니다. "arxiv 논문 번역해줘", "이 논문 한글로 번역",
  "translate this arxiv paper to Korean" 등 arXiv 링크와 함께 한국어 번역을 요청하는
  모든 경우에 사용하세요. 요약이 아닌 원문 순서 그대로의 전문 번역이 목표입니다.
license: MIT
---

# arXiv 논문 한국어 번역 스킬

arXiv 논문 링크(또는 ID)를 입력받아 **Abstract부터 Conclusion까지** 한국어 경어체로
**전문 번역**하고, 논문 제목(영문) 이름의 디렉토리 안에 `.md` 파일로 저장합니다.

## 핵심 원칙 (반드시 준수)

1. **요약 금지.** 원문의 문단 구성과 문장 순서를 그대로 한국어로 옮깁니다.
   생략·압축·의역으로 정보가 사라지면 안 됩니다.
2. **경어체.** 모든 문장을 "~합니다 / ~습니다" 체로 작성합니다.
3. **범위.** Abstract → Conclusion 까지만 번역하고,
   **References, Appendix, Acknowledgments, 각주(footnote)는 제외**합니다.
4. **용어 표기.** 기술 용어는 `한글(영어)` 형태로 원어를 남깁니다.
   예: `가지치기(pruning)`, `과적합(over-fitting)`, `완전 연결 계층(fully-connected layer)`.
   같은 문단에서 반복될 때는 한글만 써도 됩니다.
5. **수식.** 모든 수식은 LaTeX로 작성합니다.
   인라인은 `$ ... $`, 별도 줄은 `$$ ... $$` 를 쓰고,
   원문에 수식 번호가 있으면 함께 남깁니다.
6. **그림과 표.** 원문의 등장 위치를 그대로 지킵니다.
   - 이미지 파일을 확보할 수 있으면 출력 디렉토리의 `images/` 폴더에 저장하고
     상대 경로로 삽입합니다. `.md` 하나만 옮겨도 깨지지 않도록 하기 위함입니다.
     `![그림 1: (캡션 한국어 번역)](images/figure1.png)`
   - 확보하지 못하면 위치 표시만 남깁니다.
     `> *[그림 1 위치: (캡션 한국어 번역)]*`
   - 표는 내용을 한국어로 재작성하지 않고, 이미지 삽입 또는 위치 표시로만 처리합니다.

## 작업 절차

### 1단계: 논문 원문 확보

입력에서 논문 ID를 추출합니다.
`arxiv.org/abs/XXXX.XXXXX`, `arxiv.org/pdf/XXXX.XXXXX`, ID 단독 모두 허용합니다.

**LaTeX 수식과 그림·표 위치가 보존되는 소스**를 우선 확보합니다.

- 1순위: `https://arxiv.org/html/<ID>` (arXiv 자체 HTML 변환본)
- 2순위: `https://ar5iv.labs.arxiv.org/html/<ID>` (TeX → HTML 변환본)
- 3순위: 초록 페이지 `https://arxiv.org/abs/<ID>`
- 사용자가 PDF를 직접 업로드했다면 그 내용을 원문으로 사용합니다.

가져온 페이지에서 섹션 구조(Abstract, 1 Introduction, ..., Conclusion)를 파악하고
References 이후는 무시합니다.

> 원문 확보에 실패하면 임의로 채우지 말고, 사용자에게 PDF 업로드나 다른 링크를 요청합니다.

### 2단계: 번역

섹션 순서대로 번역합니다. 제목은 한국어와 영어를 병기합니다.

    ## 1. 서론 (Introduction)
    ### 3.1 정규화 (Regularization)

본문은 원문 문단 단위로 옮깁니다. 문단을 합치거나 나누지 않습니다.
수식 해석 역시 **원문이 제공하는 범위 안에서만** 옮깁니다.
원문에 없는 해설을 창작해 넣지 않습니다. 어디까지나 번역입니다.

### 3단계: 파일 저장

- **현재 작업 디렉토리** 아래에 **논문 제목(영문)** 으로 디렉토리를 만듭니다.
  - 파일시스템에서 문제되는 문자(`/ \ : * ? " < > |`)는 `_` 로 치환합니다.
  - 제목이 너무 길면 앞부분 위주로 줄입니다.
- 그 안에 번역 결과 `.md` 파일을 저장합니다.
  예: `Learning_both_Weights_and_Connections.md`
- 그림·표 이미지는 같은 디렉토리의 `images/` 폴더에 저장합니다.
- 사용자에게 파일을 전달하는 도구가 있으면 저장한 결과를 함께 제시합니다.

## 출력 마크다운 구조

    # (논문 제목 한국어 번역)
    ### (English Title)

    **저자:** (원문 그대로)

    ---

    ## 초록 (Abstract)
    (번역)

    ---

    ## 1. 서론 (Introduction)
    (번역)

    > *[그림 1 위치: ...]*

    ...

    ## N. 결론 (Conclusion)
    (번역)

## 완료 후 보고

작업이 끝나면 다음을 간단히 보고합니다.

- 번역 범위(Abstract ~ Conclusion)와 제외 항목(References / Appendix / 주석)
- 생성한 디렉토리 경로와 파일명
- 그림·표를 이미지로 삽입했는지, 실패해 위치 표시로 처리했는지

## 예시

**입력:** `https://arxiv.org/abs/1506.02626 이 논문 한글로 번역해줘`

**동작:**

1. ID `1506.02626` 추출 → HTML 변환본에서 원문 확보
2. Abstract ~ Conclusion 경어체 전문 번역 (용어 병기, 수식 LaTeX)
3. 그림은 `images/`에 내려받아 삽입, 표는 가능하면 이미지·아니면 위치 표시
4. `Learning_both_Weights_and_Connections_for_Efficient_Neural_Networks/`
   디렉토리를 만들고 그 안에 `.md`와 `images/` 저장
