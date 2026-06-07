import { useEffect, useRef } from "react";
import gsap from "gsap";

const tones = {
  pine: "text-pine",
  amber: "text-amber",
  steel: "text-steel",
  ink: "text-ink",
};

export function KpiCard({ label, value, tone = "pine" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.22 });
  }, [value]);

  return (
    <section ref={ref} className="card">
      <p className="text-sm font-medium text-steel">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone] || tones.pine}`}>{value}</p>
    </section>
  );
}
