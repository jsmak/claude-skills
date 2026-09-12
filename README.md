# jsmak-skills

Claude Code / Cowork ?ì„œ ?°ëŠ” ê°œì¸ ?¤í‚¬ ëª¨ìŒ ë§ˆì¼“?Œë ˆ?´ìŠ¤?…ë‹ˆ??

## ?¤ì¹˜

```
/plugin marketplace add ¿©±â¿¡_º»ÀÎ_¾ÆÀÌµğ/claude-skills
/plugin install jsmak-toolkit@jsmak-skills
```

?…ë°?´íŠ¸??`/plugin marketplace update jsmak-skills` ?…ë‹ˆ??

## ?˜ë¡ ?¤í‚¬

| ?¤í‚¬ | ?˜ëŠ” ??|
|---|---|
| `arxiv-korean-translation` | arXiv ?¼ë¬¸??Abstract~Conclusionê¹Œì? ?œêµ­??ê²½ì–´ì²´ë¡œ ?„ë¬¸ ë²ˆì—­ |
| `obsidian-todo-sync` | Obsidian ë³¼íŠ¸??ì²´í¬ë°•ìŠ¤ ???¼ì„ ?˜ì§‘??`TODO.md`ë¡??•ë¦¬ |

?¤ì¹˜ ??`/jsmak-toolkit:arxiv-korean-translation` ì²˜ëŸ¼ ?ŒëŸ¬ê·¸ì¸ ?´ë¦„???ì— ë¶™ìŠµ?ˆë‹¤.

## ?¤í‚¬ ì¶”ê??˜ê¸°

`skills/` ?„ë˜???”ë ‰? ë¦¬ë¥??˜ë‚˜ ë§Œë“¤ê³?`SKILL.md`ë¥??£ìœ¼ë©??ì…?ˆë‹¤.
`marketplace.json`?€ ê±´ë“œë¦¬ì? ?Šì•„???©ë‹ˆ??

```bash
mkdir -p skills/<skill-name>
$EDITOR skills/<skill-name>/SKILL.md
claude plugin validate .          # ë§ˆì¼“?Œë ˆ?´ìŠ¤ ë§¤ë‹ˆ?˜ìŠ¤??ê²€ì¦?claude plugin validate ./skills   # ?¤í‚¬ frontmatter ê²€ì¦?git add skills/<skill-name> && git commit -m "Add <skill-name> skill"
git push
```

### SKILL.md ìµœì†Œ ?•ì‹

```markdown
---
name: skill-name
description: >-
  ?¸ì œ ???¤í‚¬???¨ì•¼ ?˜ëŠ”ì§€. ?¬ìš©?ê? ?¤ì œë¡??˜ì§ˆ ë²•í•œ ë¬¸ì¥???ˆì‹œë¡??£ìœ¼ë©?  ë°œë™ ?•í™•?„ê? ?¬ë¼ê°‘ë‹ˆ??
---

# ?¤í‚¬ ?œëª©

## ?µì‹¬ ?ì¹™
...

## ?‘ì—… ?ˆì°¨
...
```

## êµ¬ì¡°

```
claude-skills/
?œâ??€ .claude-plugin/
??  ?”â??€ marketplace.json
?œâ??€ skills/
??  ?œâ??€ arxiv-korean-translation/SKILL.md
??  ?”â??€ obsidian-todo-sync/SKILL.md
?œâ??€ .gitignore
?œâ??€ LICENSE
?”â??€ README.md
```

## ?¼ì´? ìŠ¤

MIT
