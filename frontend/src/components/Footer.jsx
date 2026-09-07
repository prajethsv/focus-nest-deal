import { Github, Instagram, Linkedin } from "lucide-react";
import { useTheme } from "@/App";
import { THEMES } from "@/theme";

export default function Footer() {
  const { theme } = useTheme();
  const themeName = THEMES.find((t) => t.id === theme)?.name || "Cozy";

  return (
    <footer
      className="relative z-[1]"
      style={{ borderTop: "1px solid var(--line)" }}
      data-testid="site-footer"
    >
      <div className="container-x" style={{ padding: "clamp(3.5rem, 7vw, 5.5rem) 0 2.5rem" }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <p className="foot-word" data-testid="footer-wordmark">Focus Nest</p>
            <p className="serif-i mt-3" style={{ fontSize: "1.05rem" }}>
              a small, calm corner of your browser
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="social-btn"
              href="https://www.linkedin.com/in/prajeth-suresh-vijayalakshmi-22202b140/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              data-testid="social-linkedin"
            >
              <Linkedin size={18} />
            </a>
            <a
              className="social-btn"
              href="https://github.com/prajethsv"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              data-testid="social-github"
            >
              <Github size={18} />
            </a>
            <a
              className="social-btn"
              href="https://www.instagram.com/prajethsv/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              data-testid="social-instagram"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-14 pt-6"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            © 2026 · Designed & built by Prajeth · Focus Nest is free, and your data never leaves your browser.
          </p>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }} data-testid="footer-theme-label">
            Currently nesting in <strong style={{ color: "var(--accent)" }}>{themeName}</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
