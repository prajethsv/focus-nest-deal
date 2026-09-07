import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { joinWaitlist } from "@/lib/api";

const EASE = [0.22, 0.61, 0.36, 1];

export default function Install() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await joinWaitlist(email.trim());
      setDone(true);
    } catch {
      toast.error("Something went wrong. Mind trying again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="install" className="section-pad" data-testid="install-section">
      <div className="container-x grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <span className="pill mb-5 inline-flex">v0.5.1 · now in beta</span>
          <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", margin: 0 }}>
            Coming soon to the<br />Chrome Web Store.
          </h2>
          <p className="lead mt-5 max-w-lg">
            Focus Nest is still in the nest, getting its feathers ready for
            launch. It will be free when it lands, and it will be worth the
            wait.
          </p>
          <p className="serif-i mt-8" style={{ fontSize: "1.05rem" }}>
            "Good things take a little time."
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
        >
          <div className="card" style={{ padding: "clamp(1.6rem, 3.4vw, 2.6rem)" }}>
            {done ? (
              <motion.div
                className="text-center py-6"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                data-testid="waitlist-success"
              >
                <motion.span
                  style={{
                    display: "grid", placeItems: "center", width: 58, height: 58,
                    borderRadius: 999, margin: "0 auto 18px", color: "#fff",
                    background: "linear-gradient(165deg, var(--accent-2), var(--accent))",
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.15 }}
                >
                  <Check size={26} strokeWidth={2.6} />
                </motion.span>
                <h3 className="display" style={{ fontSize: "1.6rem", margin: 0 }}>You're in the nest.</h3>
                <p className="muted mt-2.5" style={{ fontSize: 14 }}>
                  One email when it launches. Nothing else, ever.
                </p>
              </motion.div>
            ) : (
              <>
                <p className="eyebrow mb-3">Waitlist</p>
                <h3 className="display" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", margin: 0 }}>
                  One email when it hatches.
                </h3>
                <p className="muted mt-3" style={{ fontSize: 14, lineHeight: 1.65 }}>
                  Leave your address and you'll be the first to know when Focus
                  Nest lands on the Chrome Web Store. No newsletter, no noise.
                  One email when it launches, then silence.
                </p>
                <form className="flex flex-col sm:flex-row gap-3 mt-6" onSubmit={submit}>
                  <input
                    type="email"
                    required
                    className="input flex-1"
                    placeholder="you@somewhere.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email address"
                    data-testid="waitlist-email-input"
                  />
                  <button type="submit" className="btn btn-primary" disabled={busy} data-testid="waitlist-submit-btn">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    Notify me
                  </button>
                </form>
                <p className="muted mt-4" style={{ fontSize: 11.5 }}>
                  Stored privately. We will never write to you about anything else.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
