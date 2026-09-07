const ITEMS = [
  "A small, calm corner of your browser",
  "Something is waiting in the nest",
  "Deep work without the digital noise",
  "Four environments, one nest",
  "Quiet growth, session by session",
  "Phone away, world off",
];

export default function Marquee() {
  return (
    <div className="marquee relative z-[1]" aria-hidden="true" data-testid="marquee">
      <div className="marquee-track">
        {[...ITEMS, ...ITEMS].map((t, i) => (
          <span className="marquee-item" key={i}>
            {t}
            <span className="dot">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
