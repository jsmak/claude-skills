export type Box = [number, number, number, number]; // x1, y1, x2, y2 (캡처 이미지 픽셀)

export type Beat = {
  t: number; // 장면 음성 시작부터 초
  caption: string | null;
  boxes: Box[];
  image: string; // 이 순간에 보여줄 캡처 이름 (public/<id>/<image>.png)
  zoom: boolean;
};

export type SceneData = {
  id: string;
  audio: string;
  duration: number;
  beats: Beat[];
};

export type NotebookLecture = {
  id: string; // public/<id>/ 폴더 이름
  title: string;
  summary: string[]; // 비어 있지 않으면 마지막 장면에 정리 카드
  thanksAt: number | null; // 마지막 장면에서 "감사합니다"를 띄울 시각 (초)
  scenes: SceneData[];
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const CAPTURE_WIDTH = 3840; // 캡처 이미지 가로 픽셀 (4K, 16:9)
export const TAIL = 0.6; // 장면 끝에 두는 여유 (초) — mux_audio.py 와 같아야 함

export const sceneFrames = (s: SceneData) => Math.ceil((s.duration + TAIL) * FPS);

// Remotion 컴포지션 id 는 영문·숫자·하이픈만 됩니다
export const compositionId = (prefix: string, id: string) => `${prefix}-${id.replace(/[^A-Za-z0-9-]/g, "-")}`;
