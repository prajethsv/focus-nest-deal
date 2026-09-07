import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Chapters from "@/components/Chapters";
import Environments from "@/components/Environments";
import Install from "@/components/Install";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Particles from "@/components/Particles";

export const ThemeContext = createContext({ theme: "cozy", setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("fn-theme") || "cozy"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fn-theme", theme);
  }, [theme]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    let alive = true;
    const raf = (time) => {
      if (!alive) return;
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => {
      alive = false;
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="relative min-h-screen" data-testid="app-root">
        <Particles />
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main className="relative z-[1]">
          <Hero />
          <Marquee />
          <Chapters />
          <Environments />
          <Install />
          <Contact />
        </main>
        <Footer />
        <Toaster position="bottom-center" />
      </div>
    </ThemeContext.Provider>
  );
}
