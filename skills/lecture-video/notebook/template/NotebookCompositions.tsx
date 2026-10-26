import React from "react";
import { Composition, Sequence, useCurrentFrame } from "remotion";
import { SceneView, settledTime } from "./SceneView";
import { FPS, HEIGHT, NotebookLecture, SceneData, WIDTH, compositionId, sceneFrames } from "./types";

// 음성은 넣지 않습니다. 렌더링 뒤 mux_audio.py 로 붙입니다
// (Remotion 이 오디오를 내려받을 때 localhost 가 IPv6로 연결되어 실패하는 환경이 있음).

const summaryFor = (lecture: NotebookLecture, s: SceneData) =>
  lecture.summary.length && s === lecture.scenes[lecture.scenes.length - 1]
    ? { items: lecture.summary, title: lecture.title, thanksAt: lecture.thanksAt }
    : undefined;

const SceneClip: React.FC<{ lecture: NotebookLecture; scene: SceneData }> = ({ lecture, scene }) => {
  const frame = useCurrentFrame();
  return (
    <SceneView assetDir={lecture.id} scene={scene} t={frame / FPS} summary={summaryFor(lecture, scene)}
      capture={lecture.capture} captionPlaces={lecture.captionPlaces} />
  );
};

const Lecture: React.FC<{ lecture: NotebookLecture }> = ({ lecture }) => {
  let from = 0;
  return (
    <>
      {lecture.scenes.map((s) => {
        const start = from;
        from += sceneFrames(s);
        return (
          <Sequence key={s.id} from={start} durationInFrames={sceneFrames(s)}>
            <SceneClip lecture={lecture} scene={s} />
          </Sequence>
        );
      })}
    </>
  );
};

// 확인용: beat 하나당 한 프레임 (강조가 다 옮겨 간 뒤의 모습)
const Preview: React.FC<{ lecture: NotebookLecture }> = ({ lecture }) => {
  const frame = useCurrentFrame();
  const beats = lecture.scenes.flatMap((s) => s.beats.map((b, i) => ({ s, i, b })));
  const { s, i, b } = beats[frame];
  const summary = summaryFor(lecture, s);
  const t = summary ? Math.max(settledTime(b), (summary.thanksAt ?? 0) + 1.2, summary.items.length * 0.9 + 1.5) : settledTime(b);
  return (
    <SceneView assetDir={lecture.id} scene={s} t={t} summary={summary} label={`${s.id}-${i + 1}`}
      capture={lecture.capture} captionPlaces={lecture.captionPlaces} />
  );
};

export const NotebookCompositions: React.FC<{ lectures: NotebookLecture[] }> = ({ lectures }) => (
  <>
    {lectures.map((lecture) => (
      <React.Fragment key={lecture.id}>
        <Composition
          id={compositionId("Notebook", lecture.id)}
          component={Lecture}
          defaultProps={{ lecture }}
          durationInFrames={lecture.scenes.reduce((n, s) => n + sceneFrames(s), 0)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id={compositionId("NotebookPreview", lecture.id)}
          component={Preview}
          defaultProps={{ lecture }}
          durationInFrames={lecture.scenes.reduce((n, s) => n + s.beats.length, 0)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </React.Fragment>
    ))}
  </>
);
