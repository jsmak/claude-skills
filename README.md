# jsmak-skills

Claude Code / Cowork 에서 쓰는 개인 스킬 모음 마켓플레이스입니다.

## 설치

```
/plugin marketplace add jsmak/claude-skills
/plugin install jsmak-toolkit@jsmak-skills
```

업데이트는 `/plugin marketplace update jsmak-skills` 입니다.

## 수록 스킬

| 스킬 | 하는 일 |
|---|---|
| `arxiv-korean-translation` | arXiv 논문을 Abstract~Conclusion까지 한국어 경어체로 전문 번역 |
| `obsidian-todo-sync` | Obsidian 볼트의 체크박스 할 일을 수집해 `TODO.md`로 정리 |
| `lecture-video` | 슬라이드 + 페이지별 대본/음성을 Remotion으로 전환 애니메이션·나레이션 동기화 코드 강조·GIF 프레임 동기화가 들어간 강의 mp4로 제작. **주피터/코랩 노트북(.ipynb)** 도 지원: 대본 교정 → 장면별 ElevenLabs 음성 → 코랩 화면 캡처 → 코드/출력 줄 강조·확대·자막 → 확인용 이미지 → 렌더링 (`NOTEBOOK.md`) |

설치 후 `/jsmak-toolkit:arxiv-korean-translation` 처럼 플러그인 이름이 앞에 붙습니다.

## 스킬 추가하기

`skills/` 아래에 디렉토리를 하나 만들고 `SKILL.md`를 넣으면 끝입니다.
`marketplace.json`은 건드리지 않아도 됩니다.

```bash
mkdir -p skills/<skill-name>
$EDITOR skills/<skill-name>/SKILL.md
claude plugin validate .          # 마켓플레이스 매니페스트 검증
claude plugin validate ./skills   # 스킬 frontmatter 검증
git add skills/<skill-name> && git commit -m "Add <skill-name> skill"
git push
```

### SKILL.md 최소 형식

```markdown
---
name: skill-name
description: >-
  언제 이 스킬을 써야 하는지. 사용자가 실제로 던질 법한 문장을 예시로 넣으면
  발동 정확도가 올라갑니다.
---

# 스킬 제목

## 핵심 원칙
...

## 작업 절차
...
```

## 구조

```
claude-skills/
├── .claude-plugin/
│   └── marketplace.json
├── skills/
│   ├── arxiv-korean-translation/SKILL.md
│   ├── lecture-video/
│   │   ├── SKILL.md
│   │   ├── NOTEBOOK.md       # .ipynb → 강의 영상 절차
│   │   ├── helpers/          # PDF→PNG, asset staging scripts
│   │   ├── notebook/         # 코랩 캡처·레이아웃 측정·장면 데이터·확인용 이미지·음성 합치기 + Remotion 템플릿
│   │   └── template/         # drop-in Remotion module (config-driven)
│   └── obsidian-todo-sync/SKILL.md
├── .gitattributes
├── .gitignore
├── LICENSE
└── README.md
```

## 라이선스

MIT
