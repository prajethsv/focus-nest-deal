import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { sendContact } from "@/lib/api";

const EASE = [0.22, 0.61, 0.36, 1];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await sendContact(form);
      toast.success("Sent. Thank you, it lands straight in the maker's inbox.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Something went wrong. Mind trying again?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="section-pad" data-testid="contact-section">
      <div className="container-x grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-start">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <p className="eyebrow mb-4">Feedback</p>
          <h2 className="display" style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", margin: 0 }}>
            Help shape the nest.
          </h2>
          <p className="lead mt-5 max-w-md">
            Focus Nest is built by one person who reads everything. Ideas,
            bugs, kind words, a feature you wish existed. All of it is
            welcome, and all of it matters.
          </p>
          <p className="serif-i mt-8" style={{ fontSize: "1.05rem" }}>
            "Built slowly, on purpose."
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.85, delay: 0.12, ease: EASE }}
        >
          <form className="card" style={{ padding: "clamp(1.6rem, 3.4vw, 2.4rem)" }} onSubmit={submit} data-testid="contact-form">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  className="input"
                  required
                  maxLength={120}
                  placeholder="What should we call you?"
                  value={form.name}
                  onChange={set("name")}
                  data-testid="contact-name-input"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  className="input"
                  required
                  placeholder="you@somewhere.com"
                  value={form.email}
                  onChange={set("email")}
                  data-testid="contact-email-input"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="field-label" htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                className="input"
                required
                maxLength={4000}
                placeholder="Tell us what's on your mind…"
                value={form.message}
                onChange={set("message")}
                data-testid="contact-message-input"
              />
            </div>
            <button type="submit" className="btn btn-primary mt-5" disabled={busy} data-testid="contact-submit-btn">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              Send it over
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
