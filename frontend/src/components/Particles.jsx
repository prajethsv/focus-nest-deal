import { useEffect, useRef } from "react";
import { useTheme } from "@/App";

const COLORS = {
  cozy: "201,146,79",
  rainy: "143,184,216",
  minimal: "120,115,110",
  nature: "116,161,113",
};

export default function Particles() {
  const { theme } = useTheme();
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let w = 0;
    let h = 0;
    const smallScreen = window.innerWidth < 768;
    const dpr = smallScreen ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

      const N = smallScreen ? 16 : 42;
      const ps = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.4 + Math.random() * 1.2,
      v: 0.0002 + Math.random() * 0.0006,
      o: 0.14 + Math.random() * 0.4,
      d: Math.random() * Math.PI * 2,
    }));

    const col = COLORS[theme] || COLORS.cozy;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (theme === "rainy") {
          p.y += p.v * 3.4;
          if (p.y > 1.02) {
            p.y = -0.02;
            p.x = Math.random();
          }
          const x = p.x * w;
          const y = p.y * h;
          ctx.strokeStyle = `rgba(${col},${p.o * 0.7})`;
          ctx.lineWidth = 1.1 * dpr;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 2 * dpr, y + 13 * p.s * dpr);
          ctx.stroke();
        } else {
          p.y -= p.v;
          p.d += 0.004;
          if (p.y < -0.02) {
            p.y = 1.02;
            p.x = Math.random();
          }
          const x = (p.x + Math.sin(p.d) * 0.012) * w;
          const y = p.y * h;
          ctx.fillStyle = `rgba(${col},${p.o})`;
          ctx.beginPath();
          ctx.arc(x, y, p.s * 1.9 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return <canvas ref={ref} className="particles" aria-hidden="true" data-testid="particles-canvas" />;
}
