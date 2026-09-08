import { useEffect, useState } from "react";
import {
  Check,
  History,
  Music2,
  Pause,
  Pin,
  Play,
  RotateCcw,
  Settings2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

const PRESETS = [5, 10, 25, 50];
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function NestArt({ stage }) {
  if (stage === "bird") {
    return (
      <svg viewBox="0 0 96 110" className="nest-svg" aria-hidden="true">
        <ellipse cx="24" cy="66" rx="8" ry="15" fill="#c48a3a" opacity="0.55" transform="rotate(18 24 66)" />
        <ellipse cx="72" cy="66" rx="8" ry="15" fill="#c48a3a" opacity="0.55" transform="rotate(-18 72 66)" />
        <ellipse cx="48" cy="64" rx="30" ry="29" fill="#e8b86d" />
        <ellipse cx="48" cy="76" rx="17" ry="14" fill="#fff6e8" />
        <circle cx="38" cy="52" r="3.4" fill="#3b2d20" />
        <circle cx="58" cy="52" r="3.4" fill="#3b2d20" />
        <circle cx="30" cy="60" r="4.6" fill="#f0a0a0" opacity="0.85" />
        <circle cx="66" cy="60" r="4.6" fill="#f0a0a0" opacity="0.85" />
        <polygon points="48,55 43,62 53,62" fill="#c48a3a" />
        <path d="M44 33 Q48 24 52 33" stroke="#c48a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 110" className="nest-svg" aria-hidden="true">
      <path
        d="M48 10 C65 10 80 42 80 66 C80 89 65 100 48 100 C31 100 16 89 16 66 C16 42 31 10 48 10 Z"
        fill="#f4e7d0"
        stroke="#c9a06a"
        strokeWidth="2"
      />
      <circle cx="36" cy="42" r="3" fill="#c9a06a" opacity="0.55" />
      <circle cx="58" cy="34" r="2.4" fill="#c9a06a" opacity="0.5" />
      <circle cx="62" cy="66" r="3.2" fill="#c9a06a" opacity="0.5" />
      <circle cx="34" cy="74" r="2.6" fill="#c9a06a" opacity="0.55" />
      <circle cx="48" cy="88" r="2.2" fill="#c9a06a" opacity="0.45" />
      {stage === "cracking" && (
        <polyline
          points="30,56 40,62 36,70 48,66 52,76 61,68"
          stroke="#a9713c"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function SpotifyMock() {
  return (
    <div className="ext-card ext-spotify-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="ext-label">Soundtrack</p>
          <p className="ext-card-title">Now playing</p>
        </div>
        <span className="pill"><Pin size={10} /> Pinned</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="ext-album-art" aria-hidden="true">
          <Music2 size={18} />
        </div>
        <div className="min-w-0">
          <p className="ext-track-title">morning pages</p>
          <p className="muted ext-track-meta">lofi for slow work</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="ext-btn ext-btn-ghost ext-icon-control"><SkipBack size={12} /></span>
        <span className="ext-btn ext-btn-primary ext-icon-control"><Pause size={12} /></span>
        <span className="ext-btn ext-btn-ghost ext-icon-control"><SkipForward size={12} /></span>
      </div>
    </div>
  );
}

function HistoryMock() {
  return (
    <div className="ext-card">
      <div className="flex items-center justify-between mb-3">
        <p className="ext-label">Study history</p>
        <span className="pill">6 day streak</span>
      </div>
      <div className="cal-grid-mock">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className={`cal-cell-mock ${[2, 5, 9, 10, 14, 17, 22, 24].includes(i) ? "hot" : ""} ${i === 25 ? "today" : ""}`}>
            {i + 1}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center mt-4">
        {[["12", "sessions"], ["318", "focus min"], ["9", "done"], ["6", "day streak"]].map(([n, label]) => (
          <div key={label}>
            <p className="display ext-stat-number">{n}</p>
            <p className="muted ext-stat-label">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsMock() {
  return (
    <div className="ext-settings-stack">
      <div className="ext-settings-intro">
        <p className="ext-eyebrow">Make it yours</p>
        <p className="muted">Small choices that make focus feel more like your space.</p>
      </div>
      {[
        ["Environment", "Cozy · Rainy · Minimal · Nature"],
        ["Sound", "Button clicks · Session-end chime · Volume"],
        ["Timer", "Focus length · Breaks · Auto-start"],
        ["Distraction blocker", "Only active while focus is running"],
      ].map(([title, detail]) => (
        <div className="ext-settings-row" key={title}>
          <div className="flex items-center gap-2">
            {title === "Distraction blocker" ? <Settings2 size={13} /> : <span className="ext-setting-dot" aria-hidden="true" />}
            <strong>{title}</strong>
          </div>
          <span className="muted">{detail}</span>
        </div>
      ))}
    </div>
  );
}

export default function ExtensionMockup() {
  const [lenMin, setLenMin] = useState(25);
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState("study");
  const [muted, setMuted] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [stage, setStage] = useState("egg");
  const [tasks, setTasks] = useState([
    { t: "Finish chapter notes", done: false },
    { t: "Water the plant", done: true },
    { t: "Sketch the landing page hero", done: false },
  ]);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secs !== 0) return undefined;
    setRunning(false);
    setSessions((n) => n + 1);
    setStage((st) => (st === "bird" ? "bird" : "cracking"));
    const t = setTimeout(() => {
      setStage((st) => (st === "cracking" ? "bird" : st));
      setSecs(lenMin * 60);
    }, 1100);
    return () => clearTimeout(t);
  }, [secs, lenMin]);

  const pickPreset = (p) => {
    setLenMin(p);
    setSecs(p * 60);
    setRunning(false);
  };

  const stageLabel =
    stage === "bird" ? "Pip the fledgling" : stage === "cracking" ? "Hatching…" : "Speckled egg";

  return (
    <div className="ext" data-testid="extension-mockup">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="ext-eyebrow">Focus Nest</p>
          <p className="ext-greeting">Today</p>
        </div>
        <button
          className="ext-icon-btn"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          aria-pressed={muted}
          onClick={() => setMuted((m) => !m)}
          data-testid="mock-sound-toggle"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      <div className="ext-tabbar" role="tablist">
        <button
          className={`ext-tab ${tab === "study" ? "active" : ""}`}
          role="tab"
          aria-selected={tab === "study"}
          onClick={() => setTab("study")}
          data-testid="mock-tab-study"
        >
          Study
        </button>
        <button
          className={`ext-tab ${tab === "nest" ? "active" : ""}`}
          role="tab"
          aria-selected={tab === "nest"}
          onClick={() => setTab("nest")}
          data-testid="mock-tab-nest"
        >
          Nest
        </button>
        <button
          className={`ext-tab ${tab === "history" ? "active" : ""}`}
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
          data-testid="mock-tab-history"
        >
          <History size={11} aria-hidden="true" />
          History
        </button>
        <button
          className={`ext-tab ${tab === "settings" ? "active" : ""}`}
          role="tab"
          aria-selected={tab === "settings"}
          onClick={() => setTab("settings")}
          data-testid="mock-tab-settings"
        >
          <Settings2 size={11} aria-hidden="true" />
          Settings
        </button>
      </div>

      {tab === "study" ? (
        <>
          <div className="ext-card">
            <div className="flex items-center justify-between">
              <p className="ext-label">Focus</p>
              <span className="pill">Session {(sessions % 4) + 1} of 4</span>
            </div>
            <p className="ext-time" data-testid="mock-timer-display">{fmt(secs)}</p>
            <div className="ext-progress">
              <span style={{ width: `${(1 - secs / (lenMin * 60)) * 100}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  className={`ext-preset ${lenMin === p ? "active" : ""}`}
                  aria-pressed={lenMin === p}
                  onClick={() => pickPreset(p)}
                  data-testid={`mock-preset-${p}`}
                >
                  {p}m
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                className="ext-btn ext-btn-primary inline-flex items-center gap-1.5"
                onClick={() => setRunning((r) => !r)}
                data-testid="mock-start-btn"
              >
                {running ? <Pause size={12} /> : <Play size={12} />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                className="ext-btn ext-btn-ghost inline-flex items-center gap-1.5"
                onClick={() => {
                  setRunning(false);
                  setSecs(lenMin * 60);
                }}
                data-testid="mock-reset-btn"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button className="ext-btn ext-btn-ghost inline-flex items-center gap-1.5">
                <SkipForward size={12} />
                Skip
              </button>
            </div>
          </div>

          <div className="ext-card mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <p className="ext-label">Today's tasks</p>
              <span className="pill">
                {tasks.filter((t) => t.done).length}/{tasks.length}
              </span>
            </div>
            {tasks.map((task, i) => (
              <button
                key={task.t}
                className={`ext-task ${task.done ? "done" : ""}`}
                onClick={() =>
                  setTasks((ts) => ts.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))
                }
                data-testid={`mock-task-${i}`}
              >
                <span className="tick">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="txt">{task.t}</span>
              </button>
            ))}
          </div>

          <SpotifyMock />
          <p className="ext-quote">"Small steps, warmly repeated."</p>
        </>
      ) : tab === "nest" ? (
        <div className="ext-card">
          <div className="flex items-center justify-between">
            <p className="ext-label">The nest</p>
            <span className="pill" data-testid="mock-nest-stage">{stageLabel}</span>
          </div>
          <div className="nest-stage-wrap">
            <div className={`nest-art ${stage === "cracking" ? "is-cracking" : ""} ${stage === "bird" ? "is-bird" : ""}`}>
              <NestArt stage={stage} />
            </div>
          </div>
          <p className="muted text-center" style={{ fontSize: 12, margin: "0 0 8px" }}>
            {stage === "bird"
              ? "Pip hatched, raised entirely on finished focus sessions."
              : "Finish a focus session and watch the shell stir."}
          </p>
          <div className="ext-progress">
            <span style={{ width: `${Math.min(100, (sessions / 4) * 100)}%` }} />
          </div>
          <p className="muted text-center" style={{ fontSize: 11, margin: "6px 0 0" }}>
            {sessions} of 4 sessions to the next stage
          </p>
        </div>
      ) : tab === "history" ? (
        <HistoryMock />
      ) : (
        <SettingsMock />
      )}
    </div>
  );
}
