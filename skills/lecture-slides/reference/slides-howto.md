# Building and revising the deck

## Look at the PPT draft

Export slides to PNG with PowerPoint COM (Windows), then Read the PNGs:

```powershell
$out = "<scratchpad>\dN\slides"; New-Item -ItemType Directory -Force $out | Out-Null
$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open("C:\딥러닝강의\N강\N강 초안.pptx", $true, $false, $false)
$i=1; foreach ($s in $pres.Slides) { $s.Export("$out\s$i.png","PNG",1600,900); $i++ }
$pres.Close(); $pp.Quit()
```

The same loop with `$sh.TextFrame.TextRange.Text` over `$s.Shapes` dumps the
text of a PPTX the user edited and downloaded (python-pptx is not installed).

## Create the deck

1. One publish with the Slides `type_url`, a `title` ("N강 주제"),
   `auto_open:"after_first_write"`, no files.
2. Write `project/deck.json` (full `order`, `sections`, the faces from
   `style.md`, `"lists":"css"`, `createdOnFiles`) and the cover; publish both
   with `root` = the scratchpad folder.
3. Then three slides per message: Write, Write, Write, one publish.
4. Do not render or screenshot to verify unless the user asks; say it is
   unverified.

Typical length: 12–21 slides. Map the script draft to pages first; add a
slide where the draft talks about something no draft slide shows (lecture 8:
the PM/CM multi-input example got its own slides).

## Notes = script

Each slide's `<aside>` holds exactly that page's final script text (one
sentence per line). Build the final script file from the asides so the two
never drift:

```python
import json,re,html
order=json.load(open('project/deck.json',encoding='utf-8'))['order']
for n,sid in enumerate(order,1):
    s=open(f'project/slides/{sid}.html',encoding='utf-8').read()
    note=html.unescape(re.search(r'<aside>(.*?)</aside>',s,re.S).group(1)).strip()
```

When the user later edits the script file, push changes back into the asides
with `re.subn(r'<aside>.*?</aside>', …)` (escape with `html.escape(text,
quote=False)`), then publish only the changed slides.

## Diagrams

- Prefer flex boxes + `x-shape` arrows for simple flows; pinned boxes +
  `<x-connector x1 y1 x2 y2 route="hv">` for multi-row model diagrams.
- SVG for curves and node graphs; labels are `<p>` pinned over the SVG inside
  a `position:relative` div (fonts don't load inside SVG). Give each SVG its
  own marker ids.
- Redraw paper figures in deck colors, with a citation footer. If the user
  supplies their own figure, use it instead (see SKILL.md Lessons).

## Images

Upload with `{action:"publish", url, asset:true, file_path(s)}` and use the
returned `/_blob/<id>` verbatim in `<img src>`. Check the pixel size first
(PIL) and size the `<img>` at native size or smaller.

## Revising

- Always `read` the slide(s) from the artifact first — the user edits in the
  browser (the view context's `edits` count rises) and the read is saved
  under `scratchpad/artifact-files/<id>/project/…`. Edit that copy and
  publish with that folder as `root`.
- The browser editor rewrites slides to its own style (lowercase hex,
  `position:absolute` layouts, `&nbsp;`); keep it as is.
- To publish many slides after a scripted change, pass them all in `files`.
