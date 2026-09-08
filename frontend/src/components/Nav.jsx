import { useTheme } from "@/App";
import { THEMES } from "@/theme";
import { scrollToId } from "@/lib/scroll";

const NestMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="10.5" rx="4.4" ry="5.4" fill="var(--accent-2)" />
    <path
      d="M3.5 13.5 C3.5 18.5 7 21 12 21 C17 21 20.5 18.5 20.5 13.5"
      stroke="var(--accent)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M4.5 14.5 L7 13.2 M19.5 14.5 L17 13.2 M6 17 L8.6 15.6 M18 17 L15.4 15.6"
      stroke="var(--accent)"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.55"
    />
  </svg>
);

export default function Nav() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="nav-wrap" data-testid="site-nav">
      <div className="container-x nav-inner">
        <button
          className="nav-wordmark"
          style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          data-testid="nav-logo"
        >
          <NestMark />
          Focus Nest
        </button>

        <nav className="hidden md:flex items-center gap-7" aria-label="Sections">
          <button className="nav-link" onClick={() => scrollToId("chapters")} data-testid="nav-link-chapters">
            Chapters
          </button>
          <button className="nav-link" onClick={() => scrollToId("environments")} data-testid="nav-link-environments">
            Environments
          </button>
          <button className="nav-link" onClick={() => scrollToId("install")} data-testid="nav-link-install">
            Install
          </button>
          <button className="nav-link" onClick={() => scrollToId("contact")} data-testid="nav-link-contact">
            Contact
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2" role="radiogroup" aria-label="Environment theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-dot ${theme === t.id ? "active" : ""}`}
                style={{ background: t.swatch }}
                title={t.name}
                aria-label={`${t.name} theme`}
                aria-checked={theme === t.id}
                role="radio"
                onClick={() => setTheme(t.id)}
                data-testid={`nav-theme-${t.id}`}
              />
            ))}
          </div>
          <button className="btn btn-primary" style={{ padding: "0.55rem 1.15rem", fontSize: "0.82rem" }} onClick={() => scrollToId("install")} data-testid="nav-cta">
            Get the beta
          </button>
        </div>
      </div>
    </header>
  );
}
