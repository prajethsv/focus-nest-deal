import { motion } from "framer-motion";
import { Lock, Pause, Play, RotateCcw, SkipBack, SkipForward, Pin } from "lucide-react";

const EASE = [0.22, 0.61, 0.36, 1];

const Reveal = ({ children, delay = 0, className }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 44 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-90px" }}
    transition={{ duration: 0.85, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

const TimerMock = () => (
  <div className="mock-inner max-w-sm mx-auto">
    <div className="ext-card">
      <div className="flex items-center justify-between">
        <p className="ext-label">Focus</p>
        <span className="pill">Session 2 of 4</span>
      </div>
      <p className="ext-time">24:59</p>
      <div className="ext-progress"><span style={{ width: "62%" }} /></div>
      <div className="grid grid-cols-4 gap-1.5 mt-3">
        {[5, 10, 25, 50].map((preset) => (
          <span key={preset} className={`ext-preset ${preset === 25 ? "active" : ""}`}>{preset}m</span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3.5">
        <span className="ext-btn ext-btn-primary inline-flex items-center gap-1.5"><Pause size={12} /> Pause</span>
        <span className="ext-btn ext-btn-ghost inline-flex items-center gap-1.5"><RotateCcw size={12} /> Reset</span>
        <span className="ext-btn ext-btn-ghost inline-flex items-center gap-1.5"><SkipForward size={12} /> Skip</span>
      </div>
    </div>
    <p className="ext-quote">"Phone away. Then we begin."</p>
  </div>
);

const NestMock = () => (
  <div className="mock-inner max-w-sm mx-auto text-center">
    <div className="flex items-end justify-center gap-5">
      <svg viewBox="0 0 96 110" style={{ width: 62 }} aria-hidden="true">
        <path d="M48 10 C65 10 80 42 80 66 C80 89 65 100 48 100 C31 100 16 89 16 66 C16 42 31 10 48 10 Z" fill="#f4e7d0" stroke="#c9a06a" strokeWidth="2" />
        <circle cx="36" cy="42" r="3" fill="#c9a06a" opacity="0.55" />
        <circle cx="58" cy="34" r="2.4" fill="#c9a06a" opacity="0.5" />
        <circle cx="62" cy="66" r="3.2" fill="#c9a06a" opacity="0.5" />
      </svg>
      <svg viewBox="0 0 96 110" style={{ width: 76 }} className="nest-art is-cracking" aria-hidden="true">
        <path d="M48 10 C65 10 80 42 80 66 C80 89 65 100 48 100 C31 100 16 89 16 66 C16 42 31 10 48 10 Z" fill="#f4e7d0" stroke="#c9a06a" strokeWidth="2" />
        <polyline points="30,56 40,62 36,70 48,66 52,76 61,68" stroke="#a9713c" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg viewBox="0 0 96 110" style={{ width: 88 }} className="nest-art" aria-hidden="true">
        <ellipse cx="24" cy="66" rx="8" ry="15" fill="#c48a3a" opacity="0.55" transform="rotate(18 24 66)" />
        <ellipse cx="72" cy="66" rx="8" ry="15" fill="#c48a3a" opacity="0.55" transform="rotate(-18 72 66)" />
        <ellipse cx="48" cy="64" rx="30" ry="29" fill="#e8b86d" />
        <ellipse cx="48" cy="76" rx="17" ry="14" fill="#fff6e8" />
        <circle cx="38" cy="52" r="3.4" fill="#3b2d20" />
        <circle cx="58" cy="52" r="3.4" fill="#3b2d20" />
        <circle cx="30" cy="60" r="4.6" fill="#f0a0a0" opacity="0.85" />
        <circle cx="66" cy="60" r="4.6" fill="#f0a0a0" opacity="0.85" />
        <polygon points="48,55 43,62 53,62" fill="#c48a3a" />
      </svg>
    </div>
    <div className="ext-progress mt-6"><span style={{ width: "75%" }} /></div>
    <p className="muted" style={{ fontSize: 12, marginTop: 7 }}>3 of 4 sessions to the next stage</p>
  </div>
);

const BlockerMock = () => (
  <div className="mock-inner max-w-md mx-auto">
    <div className="mock-window">
      <div className="mock-window-bar">
        <span className="wd" /><span className="wd" /><span className="wd" />
        <span className="mock-url"><Lock size={10} /> reddit.com</span>
      </div>
      <div className="text-center" style={{ padding: "2.2rem 1.5rem" }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3" aria-hidden="true">
          <ellipse cx="12" cy="10.5" rx="4.4" ry="5.4" fill="var(--accent-2)" />
          <path d="M3.5 13.5 C3.5 18.5 7 21 12 21 C17 21 20.5 18.5 20.5 13.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <p className="display" style={{ fontSize: "1.35rem", margin: 0 }}>This site is resting.</p>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
          <strong style={{ fontVariantNumeric: "tabular-nums" }}>18:42</strong> left in this focus session.
        </p>
        <p className="muted" style={{ fontSize: 11.5, margin: "6px 0 0" }}>
          Focus Nest will bring you back when it ends.
        </p>
      </div>
    </div>
  </div>
);

const SoundMock = () => (
  <div className="mock-inner max-w-sm mx-auto">
    <div className="ext-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="ext-label">Soundtrack</p>
          <p className="ext-card-title">Now playing</p>
        </div>
        <span className="pill"><Pin size={10} /> Pinned</span>
      </div>
      <div className="flex items-center gap-3.5">
        <div
          style={{
            width: 62, height: 62, borderRadius: 13, flex: "none",
            background: "linear-gradient(135deg, var(--accent-2), var(--accent))",
            boxShadow: "0 10px 22px -10px rgba(0,0,0,0.4)",
            position: "relative", overflow: "hidden",
          }}
          aria-hidden="true"
        >
          <div style={{ position: "absolute", width: 26, height: 26, borderRadius: 999, background: "rgba(255,255,255,0.28)", top: 9, left: 11 }} />
          <div style={{ position: "absolute", width: 12, height: 12, borderRadius: 999, background: "rgba(255,255,255,0.4)", bottom: 10, right: 12 }} />
        </div>
        <div className="min-w-0">
          <p style={{ margin: 0, fontWeight: 650, fontSize: 14.5 }}>morning pages</p>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>lofi for slow work</p>
          <div className="eq mt-2" aria-hidden="true"><span /><span /><span /><span /><span /></div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2.5 mt-3.5">
        <span className="ext-btn ext-btn-ghost" style={{ padding: "7px 11px" }}><SkipBack size={13} /></span>
        <span className="ext-btn ext-btn-primary" style={{ borderRadius: 999, padding: "8px 16px" }}><Play size={13} /></span>
        <span className="ext-btn ext-btn-ghost" style={{ padding: "7px 11px" }}><SkipForward size={13} /></span>
      </div>
    </div>
  </div>
);

const HOT = { 2: 1, 3: 1, 5: 2, 9: 1, 10: 2, 11: 1, 14: 1, 17: 2, 18: 1, 22: 1, 23: 2, 24: 1, 25: 2 };
const MemoryMock = () => (
  <div className="mock-inner max-w-sm mx-auto">
    <div className="ext-card">
      <div className="flex items-center justify-between mb-3">
        <p className="ext-label">Study history</p>
        <span className="pill">6 day streak</span>
      </div>
      <div className="cal-grid-mock">
        {Array.from({ length: 28 }, (_, i) => {
          const heat = HOT[i];
          return (
            <span
              key={i}
              className={`cal-cell-mock ${heat ? `hot ${heat === 2 ? "hot-2" : ""}` : ""} ${i === 25 ? "today" : ""}`}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center mt-4">
        {[["12", "sessions"], ["318", "focus min"], ["9", "done"], ["6", "day streak"]].map(([n, l]) => (
          <div key={l}>
            <p className="display" style={{ fontSize: "1.35rem", margin: 0 }}>{n}</p>
            <p className="muted" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CHAPTERS = [
  {
    num: "01",
    title: "Sessions that feel like rituals",
    blurb:
      "A pomodoro timer with gentle presets, a quiet 'phone away' moment before you start, and a soft chime when you're done. Breaks arrive on rhythm, never as interruptions.",
    Mock: TimerMock,
  },
  {
    num: "02",
    title: "Something is waiting in the nest",
    blurb:
      "Every finished session feeds a small companion. A speckled egg stirs, cracks, and hatches into a bird you name and colour yourself. It grows only from real work, and nothing is ever lost.",
    Mock: NestMock,
  },
  {
    num: "03",
    title: "Blocked, but only while it matters",
    blurb:
      "Add the sites that steal your afternoons. Focus Nest quiets them strictly during focus minutes, never during breaks, never while paused, and walks you back when the session ends.",
    Mock: BlockerMock,
  },
  {
    num: "04",
    title: "Spotify, one click away",
    blurb:
      "Connect Spotify and control the soundtrack without leaving your flow. Pin the mini player to any corner of any website, tinted by the album art of whatever is playing.",
    Mock: SoundMock,
  },
  {
    num: "05",
    title: "Gentle streaks, zero guilt",
    blurb:
      "A calm calendar remembers every finished session: heat-dotted days, honest stats, a streak that encourages instead of accuses. Missed a day? The nest doesn't mind.",
    Mock: MemoryMock,
  },
];

export default function Chapters() {
  return (
    <section id="chapters" className="section-pad" data-testid="chapters-section">
      <div className="container-x">
        <Reveal className="max-w-2xl mb-20">
          <p className="eyebrow mb-4">The manifesto</p>
          <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", margin: 0 }}>
            Five quiet ideas,<br />one tiny extension.
          </h2>
        </Reveal>

        <div className="flex flex-col" style={{ gap: "clamp(5rem, 10vw, 8.5rem)" }}>
          {CHAPTERS.map((c, i) => (
            <div
              key={c.num}
              className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center"
              data-testid={`chapter-${c.num}`}
            >
              <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                <p className="chapter-num" aria-hidden="true">{c.num}</p>
                <h3 className="display" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)", margin: "0.9rem 0 1rem" }}>
                  {c.title}
                </h3>
                <p className="lead" style={{ maxWidth: "34rem" }}>{c.blurb}</p>
              </Reveal>
              <Reveal delay={0.12} className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="mock-frame">
                  <c.Mock />
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
