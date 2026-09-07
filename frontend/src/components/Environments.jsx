import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme } from "@/App";

const EASE = [0.22, 0.61, 0.36, 1];

const PREVIEW = {
  cozy: {
    grad: "linear-gradient(163deg,#fdf4e9,#f3ddc2)",
    accent: "#a9713c",
    ink: "#3b2d20",
    card: "rgba(255,252,246,0.92)",
    mood: "Warm lamplight and tea.",
  },
  rainy: {
    grad: "linear-gradient(165deg,#263039,#1a2027)",
    accent: "#6f9dc4",
    ink: "#e2e9ef",
    card: "rgba(58,71,84,0.72)",
    mood: "Rain on the window, deep work inside.",
  },
  minimal: {
    grad: "linear-gradient(165deg,#fbfaf9,#efeeeb)",
    accent: "#4b4741",
    ink: "#23201d",
    card: "rgba(255,255,255,0.94)",
    mood: "Paper-white quiet. Nothing extra.",
  },
  nature: {
    grad: "linear-gradient(163deg,#f2f9ee,#d9ecd4)",
    accent: "#4f7d52",
    ink: "#263a2b",
    card: "rgba(252,255,250,0.9)",
    mood: "A windowsill garden for your tabs.",
  },
};

export default function Environments() {
  const { theme, setTheme } = useTheme();

  return (
    <section id="environments" className="section-pad" data-testid="environments-section">
      <div className="container-x">
        <motion.div
          className="max-w-2xl mb-14"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <p className="eyebrow mb-4">Environments</p>
          <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", margin: 0 }}>
            Pick a sky for your nest.
          </h2>
          <p className="lead mt-5">
            The extension ships with four calm environments. This page speaks
            all four of them. Go on, try one. Everything follows.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Object.entries(PREVIEW).map(([id, p], i) => (
            <motion.button
              key={id}
              className={`env-card ${theme === id ? "active" : ""}`}
              onClick={() => setTheme(id)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.09, ease: EASE }}
              data-testid={`env-card-${id}`}
            >
              <div className="env-prev" style={{ background: p.grad }}>
                <div className="env-mini" style={{ background: p.card, border: `1px solid ${p.accent}33` }}>
                  <p className="env-mini-time" style={{ color: p.ink, margin: 0 }}>25:00</p>
                  <div style={{ height: 4, borderRadius: 99, background: `${p.accent}30`, margin: "8px 0 10px", overflow: "hidden" }}>
                    <div style={{ width: "38%", height: "100%", borderRadius: 99, background: p.accent }} />
                  </div>
                  <div style={{ height: 7, width: "72%", borderRadius: 99, background: `${p.ink}1f`, marginBottom: 6 }} />
                  <div style={{ height: 7, width: "48%", borderRadius: 99, background: `${p.ink}14` }} />
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ padding: "14px 16px" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 650, fontSize: 14.5, textTransform: "capitalize" }}>{id}</p>
                  <p className="muted" style={{ margin: 0, fontSize: 12 }}>{p.mood}</p>
                </div>
                {theme === id && (
                  <span
                    style={{
                      display: "grid", placeItems: "center", width: 22, height: 22,
                      borderRadius: 999, background: "var(--accent)", color: "#fff", flex: "none",
                    }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
