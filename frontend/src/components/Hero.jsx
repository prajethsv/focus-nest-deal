import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, Sparkle } from "lucide-react";
import ExtensionMockup from "./ExtensionMockup";
import { scrollToId } from "@/lib/scroll";

const EASE = [0.22, 0.61, 0.36, 1];

const LINES = [
  <>A small, <em className="serif-i">calm</em></>,
  <>corner of</>,
  <>your <em className="serif-i">browser.</em></>,
];

export default function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 16 });
  const sy = useSpring(my, { stiffness: 55, damping: 16 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      onMouseMove={onMouseMove}
      data-testid="hero-section"
    >
      <div className="hero-blob" style={{ width: 520, height: 520, top: "-10%", left: "-8%" }} aria-hidden="true" />
      <div className="hero-blob" style={{ width: 420, height: 420, bottom: "-12%", right: "-6%", animationDelay: "-5s" }} aria-hidden="true" />

      <div className="container-x grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-8 items-center min-h-screen pt-32 pb-20">
        <div className="relative z-[1]">
          <motion.p
            className="eyebrow mb-6 flex items-center gap-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          >
            <Sparkle size={13} />
            A browser extension for gentle productivity
          </motion.p>

          <h1 className="hero-title" data-testid="hero-title">
            {LINES.map((line, i) => (
              <span className="line-mask" key={i}>
                <motion.span
                  initial={{ y: "112%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.95, delay: 0.28 + i * 0.13, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="lead max-w-xl mt-7"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
          >
            Focus Nest pairs a soft pomodoro timer with small tasks, calm
            environments, a companion that grows as you work, and a blocker
            that only wakes while you focus. No accounts. Nothing leaves
            your browser.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center gap-3.5 mt-9"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: EASE }}
          >
            <button className="btn btn-primary" onClick={() => scrollToId("install")} data-testid="hero-waitlist-btn">
              Join the waitlist
            </button>
            <button className="btn btn-ghost" onClick={() => scrollToId("chapters")} data-testid="hero-explore-btn">
              See how it feels
              <ArrowDown size={15} />
            </button>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-2.5 mt-9"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.2 }}
          >
            <span className="pill">v0.5.1 · beta</span>
            <span className="pill">Free, forever</span>
            <span className="pill">4 environments</span>
            <span className="pill">1 growing companion</span>
          </motion.div>
        </div>

        <motion.div
          className="relative z-[1] flex justify-center lg:justify-end"
          style={{ perspective: 1000 }}
          initial={{ opacity: 0, y: 80, rotate: 5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 90, delay: 0.75 }}
        >
          <motion.div style={{ rotateX, rotateY, transformPerspective: 1000 }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <ExtensionMockup />
            </motion.div>
          </motion.div>
          <p
            className="absolute -bottom-9 right-0 left-0 text-center muted"
            style={{ fontSize: 12, fontStyle: "italic", fontFamily: "var(--serif)" }}
          >
            This little popup is alive. Press Start.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
