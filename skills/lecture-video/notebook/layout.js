// Colab 노트북의 셀·코드 줄·출력 줄 위치를 재서 JSON으로 돌려줍니다.
// Claude in Chrome 의 javascript_tool 로 이 파일 내용을 그대로 실행한 뒤
//   await __nbLayout()        -> 전체 길이(문자 수)
//   __nbChunk(0), __nbChunk(1) ... -> 800자씩 잘라서 읽기 (도구 출력이 약 1000자에서 잘림, 한글은 더 일찍)
// 를 차례로 호출하고, 이어 붙인 문자열을 layout.json 으로 저장합니다.
//
// 좌표는 모두 "css px, 스크롤 0 기준 절대 y" 입니다. 캡처 이미지 픽셀로 바꾸는 배율(k)은
// devicePixelRatio 이고, build_scenes.py 가 캡처 때의 scrollTop 을 빼서 변환합니다.
// Monaco 는 화면에 보이는 줄만 그리므로 셀마다 스크롤해 가며 잽니다.
(() => {
  // Monaco 가 줄을 다 그릴 때까지 기다립니다 (짧으면 글자 폭이 덜 그려진 상태로 재짐)
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));

  const scroller = () => {
    let el = document.querySelector(".cell")?.parentElement;
    while (el && !(el.scrollHeight > el.clientHeight + 10 && getComputedStyle(el).overflowY !== "visible")) {
      el = el.parentElement;
    }
    return el;
  };

  window.__nbLayout = async () => {
    const sc = scroller();
    window.__sc = sc;
    const keep = sc.scrollTop;
    const rng = document.createRange();
    const cells = [];
    const all = [...document.querySelectorAll(".cell")];
    for (let ci = 0; ci < all.length; ci++) {
      const cell = all[ci];
      sc.scrollTop = Math.max(0, cell.getBoundingClientRect().top + sc.scrollTop - 150);
      await nextFrame();
      const abs = (y) => +(y + sc.scrollTop).toFixed(1);
      const r = cell.getBoundingClientRect();
      const info = { i: ci, type: cell.classList.contains("code") ? "code" : "markdown", top: abs(r.top), bottom: abs(r.bottom) };

      const lines = [...cell.querySelectorAll(".view-line")];
      if (lines.length) {
        const first = lines[0].getBoundingClientRect();
        // 글자 폭은 ASCII만 있는 줄로 잽니다 (한글은 2칸, →·× 같은 기호는 1칸이라 섞이면 틀림)
        // 들여쓰기가 있는 줄은 앞 공백 폭이 다르게 재져서 제외합니다
        const sized = lines.find((l) => /^[\x21-\x7e][\x20-\x7e]{5,}$/.test(l.textContent)) || lines[0];
        rng.selectNodeContents(sized);
        const tr = rng.getBoundingClientRect();
        const txt = sized.textContent;
        const lead = txt.length - txt.trimStart().length;
        info.code = {
          firstTop: abs(first.top),
          lineHeight: +first.height.toFixed(2),
          left: +(tr.left - lead * (tr.width / Math.max(1, txt.length))).toFixed(1),
          charWidth: +(tr.width / Math.max(1, txt.length)).toFixed(3),
        };
      }

      const pre = cell.querySelector(".output pre") || cell.querySelector(".output .output_text");
      if (pre) {
        const out = [];
        const w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          let i = 0;
          for (const line of n.textContent.split("\n")) {
            if (line.trim()) {
              rng.setStart(n, i);
              rng.setEnd(n, i + line.length);
              const lr = rng.getBoundingClientRect();
              out.push([abs(lr.top), +lr.left.toFixed(1), +lr.right.toFixed(1), +lr.height.toFixed(1)]);
            }
            i += line.length + 1;
          }
        }
        info.output = out; // [top, left, right, height] — 빈 줄은 건너뜀
      }

      const md = [...cell.querySelectorAll(".markdown h1, .markdown h2, .markdown h3, .markdown p, .markdown li, .markdown img")];
      if (md.length) {
        info.markdown = md.map((e) => {
          // 문단 요소는 화면 끝까지 넓으므로 글자가 실제로 차지하는 범위를 잽니다
          rng.selectNodeContents(e);
          const b = e.tagName === "IMG" ? e.getBoundingClientRect() : rng.getBoundingClientRect();
          return [abs(b.top), +b.left.toFixed(1), +b.right.toFixed(1), abs(b.bottom), e.tagName === "IMG" ? "[img]" : e.innerText.split("\n")[0].slice(0, 24)];
        });
      }
      cells.push(info);
    }
    sc.scrollTop = keep;
    window.__nbJson = JSON.stringify({ k: devicePixelRatio, viewportTop: +sc.getBoundingClientRect().top.toFixed(1), cells });
    return window.__nbJson.length;
  };

  window.__nbChunk = (i, size = 800) => window.__nbJson.slice(i * size, (i + 1) * size);
  window.__nbScroll = (y) => {
    (window.__sc || scroller()).scrollTop = y;
    return (window.__sc || scroller()).scrollTop;
  };
  return "layout helpers ready";
})();
