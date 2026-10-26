import React from "react";
import { AbsoluteFill, Easing, Img, staticFile } from "remotion";
import { Beat, Box, DEFAULT_CAPTURE, HEIGHT, Place, SceneData, WIDTH } from "./types";

const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const ACCENT = "#FFC83D";
const MOVE = 0.55; // 강조가 옮겨 가는 시간 (초)
const MAX_ZOOM = 2.0; // 4K 캡처면 2배까지 확대해도 선명합니다 (QHD 캡처는 1.33배부터 약간 흐려짐)

type Camera = { s: number; cx: number; cy: number };

const ease = (x: number) =>
  Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, x)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const union = (boxes: Box[]): Box =>
  boxes.reduce<Box>(
    (u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])],
    [Infinity, Infinity, -Infinity, -Infinity],
  );

// 강조 영역이 화면에 크게 보이도록 카메라(확대 배율, 중심)를 정합니다.
// scale = 캡처 이미지 픽셀 → 화면 픽셀
const cameraFor = (beat: Beat, scale: number): Camera => {
  if (!beat.zoom || beat.boxes.length === 0) return { s: 1, cx: WIDTH / 2, cy: HEIGHT / 2 };
  const [x1, y1, x2, y2] = union(beat.boxes).map((v) => v * scale);
  const s = Math.max(1, Math.min(MAX_ZOOM, (0.7 * WIDTH) / (x2 - x1), (0.5 * HEIGHT) / (y2 - y1)));
  const clamp = (v: number, half: number, full: number) => Math.min(full - half, Math.max(half, v));
  return {
    s,
    cx: clamp((x1 + x2) / 2, WIDTH / 2 / s, WIDTH),
    cy: clamp((y1 + y2) / 2, HEIGHT / 2 / s, HEIGHT),
  };
};

const toScreen = (cam: Camera, scale: number, x: number, y: number) => [
  (x * scale - cam.cx) * cam.s + WIDTH / 2,
  (y * scale - cam.cy) * cam.s + HEIGHT / 2,
];

const PLACE_TOP: Record<Place, number> = { bottom: HEIGHT - 70 - 110, top: 150, middle: HEIGHT / 2 - 55 };

const Caption: React.FC<{ text: string; since: number; place: Place }> = ({ text, since, place }) => {
  const p = ease(since / 0.35);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: PLACE_TOP[place],
        display: "flex",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * (place === "top" ? -24 : 24)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 50,
          fontWeight: 700,
          color: "#fff",
          background: "rgba(18, 20, 28, 0.92)",
          borderLeft: `10px solid ${ACCENT}`,
          borderRadius: 14,
          padding: "20px 40px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
          letterSpacing: -0.5,
          whiteSpace: "pre",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Summary: React.FC<{ items: string[]; t: number; title: string; thanksAt: number | null }> = ({
  items,
  t,
  title,
  thanksAt,
}) => {
  const fade = ease(t / 0.6);
  return (
    <AbsoluteFill
      style={{
        background: `rgba(10, 12, 18, ${0.82 * fade})`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      <div style={{ opacity: fade, width: 1240 }}>
        <div style={{ fontSize: 40, color: ACCENT, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 40 }}>정리</div>
        {items.map((it, i) => {
          const p = ease((t - 0.8 - i * 0.9) / 0.4);
          return (
            <div
              key={it}
              style={{
                fontSize: 46,
                fontWeight: 600,
                margin: "18px 0",
                opacity: p,
                transform: `translateX(${(1 - p) * 30}px)`,
              }}
            >
              <span style={{ color: ACCENT, marginRight: 22 }}>▸</span>
              {it}
            </div>
          );
        })}
        {thanksAt !== null ? (
          <div style={{ fontSize: 60, fontWeight: 800, color: ACCENT, marginTop: 50, opacity: ease((t - thanksAt) / 0.5) }}>
            감사합니다
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export const SceneView: React.FC<{
  assetDir: string; // public/ 아래 폴더 (강의 id)
  scene: SceneData;
  t: number;
  summary?: { items: string[]; title: string; thanksAt: number | null };
  label?: string; // 확인용 이미지에만 찍는 장면-순서 번호
  capture?: { width: number; height: number };
  captionPlaces?: Place[];
}> = ({ assetDir, scene, t, summary, label, capture = DEFAULT_CAPTURE, captionPlaces = ["bottom", "top", "middle"] }) => {
  const scale = WIDTH / capture.width;
  const beats = scene.beats;
  let i = 0;
  while (i + 1 < beats.length && beats[i + 1].t <= t) i++;
  const cur = beats[i];
  const prev = i > 0 ? beats[i - 1] : null;
  const since = t - cur.t;
  const p = prev ? ease(since / MOVE) : 1;

  const c1 = cameraFor(cur, scale);
  const c0 = prev ? cameraFor(prev, scale) : c1;
  const cam: Camera = { s: lerp(c0.s, c1.s, p), cx: lerp(c0.cx, c1.cx, p), cy: lerp(c0.cy, c1.cy, p) };

  const dim0 = prev && prev.boxes.length ? 1 : 0;
  const dim1 = cur.boxes.length ? (prev ? 1 : ease(since / MOVE)) : 0;
  const dim = 0.58 * lerp(dim0, dim1, p);

  const layers: { boxes: Box[]; opacity: number }[] = [{ boxes: cur.boxes, opacity: prev ? p : dim1 }];
  if (prev && p < 1) layers.push({ boxes: prev.boxes, opacity: 1 - p });

  const transform = `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) scale(${cam.s}) translate(${-cam.cx}px, ${-cam.cy}px)`;
  const W = capture.width;
  const H = capture.height;

  // 자막은 허용된 자리 중 강조 박스를 가장 적게 가리는 곳에 둡니다 (같으면 앞에 적힌 자리).
  const covered = (zoneTop: number, zoneBottom: number) =>
    cur.boxes.reduce((sum, b) => {
      const [x1, y1] = toScreen(c1, scale, b[0], b[1]);
      const [x2, y2] = toScreen(c1, scale, b[2], b[3]);
      const h = Math.max(0, Math.min(y2, zoneBottom) - Math.max(y1, zoneTop));
      const w = Math.max(0, Math.min(x2, WIDTH - 300) - Math.max(x1, 300));
      return sum + h * w;
    }, 0);
  const zone: Record<Place, [number, number]> = {
    bottom: [HEIGHT - 200, HEIGHT - 50],
    top: [130, 280],
    middle: [HEIGHT / 2 - 75, HEIGHT / 2 + 75],
  };
  const spots = captionPlaces.map((place) => ({ place, area: covered(...zone[place]) }));
  const captionPlace = spots.reduce((a, b) => (b.area < a.area ? b : a)).place;

  const sameCaption = prev && prev.caption === cur.caption;
  const captionSince = sameCaption ? since + 10 : since;
  const showImagePrev = prev && prev.image !== cur.image && p < 1;

  return (
    <AbsoluteFill style={{ background: "#1e1f24", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform }}>
        {showImagePrev ? (
          <Img src={staticFile(`${assetDir}/${prev!.image}.png`)} style={{ position: "absolute", width: WIDTH, height: HEIGHT }} />
        ) : null}
        <Img
          src={staticFile(`${assetDir}/${cur.image}.png`)}
          style={{ position: "absolute", width: WIDTH, height: HEIGHT, opacity: showImagePrev ? p : 1 }}
        />
        <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", width: WIDTH, height: HEIGHT }}>
          <defs>
            <mask id={`m-${scene.id}`}>
              <rect x={0} y={0} width={W} height={H} fill="white" />
              {layers.map((l, li) =>
                l.boxes.map((b, bi) => (
                  <rect key={`${li}-${bi}`} x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} rx={14}
                    fill="black" fillOpacity={l.opacity} />
                )),
              )}
            </mask>
          </defs>
          <rect x={0} y={0} width={W} height={H} fill="black" opacity={dim} mask={`url(#m-${scene.id})`} />
          {layers.map((l, li) =>
            l.boxes.map((b, bi) => (
              <rect key={`${li}-${bi}`} x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} rx={14}
                fill="none" stroke={ACCENT} strokeWidth={7} opacity={l.opacity}
                style={{ filter: `drop-shadow(0 0 14px ${ACCENT}aa)` }} />
            )),
          )}
        </svg>
      </AbsoluteFill>

      {cur.caption ? <Caption text={cur.caption} since={captionSince} place={captionPlace} /> : null}
      {summary ? <Summary {...summary} t={t} /> : null}
      {label ? (
        <div style={{ position: "absolute", left: 24, top: 18, fontFamily: FONT, fontSize: 34, fontWeight: 800,
          color: "#000", background: ACCENT, padding: "4px 16px", borderRadius: 8 }}>
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const settledTime = (beat: Beat) => beat.t + 1.0;
