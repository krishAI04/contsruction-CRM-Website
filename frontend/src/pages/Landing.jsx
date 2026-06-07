import { useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Gauge,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const workflow = [
  ["01", "Lead captured", "Facebook, Instagram, website, Excel import, or walk-in lead enters the CRM."],
  ["02", "Auto assigned", "The lead goes to the right salesperson by city, budget, or fair rotation."],
  ["03", "AI lead score", "The team sees priority, reason, and the best next action."],
  ["04", "Follow-up ready", "AI writes email, call script, and WhatsApp copy for the salesperson."],
  ["05", "Site visit", "Engineer notes become a clean summary, action items, and risks."],
  ["06", "Proposal sent", "AI drafts a proposal, manager approves it, and the lead moves forward."],
  ["07", "Won or lost", "The owner sees revenue, conversion, lost reasons, and sales performance."],
];

const features = [
  { icon: BrainCircuit, title: "AI sales assistant", text: "Lead scoring, follow-up copy, proposal drafts, and meeting summaries built into the sales flow." },
  { icon: UsersRound, title: "Smart assignment", text: "City match first, high-budget leads to stronger closers, then round robin when needed." },
  { icon: FileText, title: "Proposal control", text: "Draft, approve, download PDF, and move the client forward without losing context." },
  { icon: MailCheck, title: "Demo-safe email", text: "The public demo shows the email workflow without sending from your private inbox." },
];

const metrics = [
  ["155", "Leads tracked"],
  ["100+", "New inquiries"],
  ["AI", "Follow-up copy"],
  ["10/day", "Public AI cap"],
];

export function Landing() {
  const rootRef = useRef(null);
  const navigate = useNavigate();

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openDemo() {
    navigate("/login");
  }

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-copy", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" });
      gsap.fromTo(".hero-proof", { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.22, ease: "power3.out" });
      gsap.utils.toArray(".reveal").forEach((item) => {
        gsap.fromTo(item, { autoAlpha: 0, y: 34 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top 82%" },
        });
      });
      const roadPath = document.querySelector(".road-progress-path");
      if (roadPath) {
        const pathLength = roadPath.getTotalLength();
        gsap.set(roadPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
        gsap.to(roadPath, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: ".road-workflow", start: "top 62%", end: "bottom 58%", scrub: true },
        });
      }
      gsap.utils.toArray(".workflow-stop").forEach((item) => {
        gsap.fromTo(item, { autoAlpha: 0, y: 46, scale: 0.94 }, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top 82%", end: "center 42%", scrub: true },
        });
        gsap.to(item, {
          autoAlpha: 0,
          y: -34,
          scale: 0.96,
          ease: "power2.in",
          scrollTrigger: { trigger: item, start: "center 28%", end: "bottom 8%", scrub: true },
        });
      });
      gsap.to(".proof-screen", {
        y: -24,
        ease: "none",
        scrollTrigger: { trigger: ".proof-section", start: "top bottom", end: "bottom top", scrub: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={rootRef} className="min-h-dvh bg-[#f5f7fa] text-[#111827]">
      <section className="relative min-h-dvh overflow-hidden bg-[#101820] text-white">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src="/landing/construction-hero.mp4"
          poster="/landing/construction-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#0b1320]/72" />
        <div className="absolute inset-x-0 top-0 z-40">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
            <Link to="/home" className="flex items-center gap-3" aria-label="BuildFlow CRM home">
              <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/10">
                <Gauge size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.22em] text-white/60">BuildFlow</span>
                <span className="block text-lg font-black tracking-tight">CRM</span>
              </span>
            </Link>
            <div className="hidden items-center gap-6 text-sm font-semibold text-white/78 md:flex">
              <button type="button" onClick={() => scrollToSection("workflow")} className="cursor-pointer hover:text-white">Workflow</button>
              <button type="button" onClick={() => scrollToSection("proof")} className="cursor-pointer hover:text-white">Product</button>
              <button type="button" onClick={() => scrollToSection("demo-safe")} className="cursor-pointer hover:text-white">Demo</button>
            </div>
            <button type="button" onClick={openDemo} className="rounded-md bg-white px-4 py-2.5 text-sm font-bold text-[#111827] transition hover:bg-blue-50">
              Open Demo
            </button>
          </nav>
        </div>

        <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl items-end px-5 pb-10 pt-28 md:px-8 md:pb-14">
          <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-end">
            <div className="hero-copy max-w-4xl">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-bold text-white/80">
                AI-powered sales CRM for construction teams
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
                Turn construction leads into signed projects.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 md:text-xl">
                BuildFlow helps a construction company capture leads, assign salespeople, generate follow-ups, prepare proposals, and monitor every deal from first call to final decision.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#2563eb] px-5 text-sm font-bold text-white transition hover:bg-blue-500">
                  Try the CRM <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <button type="button" onClick={() => scrollToSection("proof")} className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/24 px-5 text-sm font-bold text-white transition hover:bg-white/10">
                  See what it does
                </button>
              </div>
            </div>
            <div className="hero-proof rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                {metrics.map(([value, label]) => (
                  <div key={label} className="rounded-md border border-white/12 bg-black/20 p-4">
                    <p className="text-3xl font-black">{value}</p>
                    <p className="mt-1 text-sm font-semibold text-white/68">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/70">
                Public demo mode protects email sending and caps AI usage, so visitors can explore without burning private resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="road-workflow relative overflow-hidden bg-[#101820] py-20 text-white md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.22),transparent_30%),linear-gradient(180deg,#101820_0%,#111827_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <div className="reveal max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">The sales road</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Every lead follows a visible path.</h2>
            <p className="mt-4 text-lg leading-8 text-white/72">
              Scroll through the route from first inquiry to final decision. Each stop shows what the CRM does for the sales team.
            </p>
          </div>

          <div className="relative mt-12 min-h-[1400px] md:min-h-[1850px]">
            <svg className="pointer-events-none absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] w-[360px] -translate-x-1/2 md:block" viewBox="0 0 360 1700" preserveAspectRatio="none" aria-hidden="true">
              <path d="M180 10 C60 150 300 260 180 410 C60 560 310 680 180 835 C55 1000 305 1110 180 1265 C70 1405 290 1520 180 1690" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="10" strokeLinecap="round" />
              <path className="road-progress-path" d="M180 10 C60 150 300 260 180 410 C60 560 310 680 180 835 C55 1000 305 1110 180 1265 C70 1405 290 1520 180 1690" fill="none" stroke="#60a5fa" strokeWidth="8" strokeLinecap="round" />
            </svg>
            <div className="absolute left-5 top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-white/18 md:hidden" />
            <div className="road-progress absolute left-5 top-4 h-[calc(100%-2rem)] w-1 rounded-full bg-blue-400 shadow-[0_0_28px_rgba(96,165,250,0.8)] md:hidden" />
            <div className="relative grid gap-24 md:gap-36">
              {workflow.map(([number, title, text], index) => {
                const isRight = index % 2 === 1;
                return (
                  <article key={number} className={`workflow-stop relative grid gap-4 pl-12 md:grid-cols-[1fr_120px_1fr] md:items-center md:pl-0 ${isRight ? "" : ""}`}>
                    <div className={`workflow-card rounded-lg border border-white/14 bg-white/10 p-5 shadow-2xl backdrop-blur md:max-w-md ${isRight ? "md:col-start-3 md:justify-self-start" : "md:col-start-1 md:justify-self-end"}`}>
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-blue-500 px-2 text-sm font-black text-white">{number}</span>
                      <h3 className="mt-4 text-2xl font-black">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/72">{text}</p>
                    </div>
                    <div className="absolute left-0 top-6 md:static md:col-start-2 md:row-start-1 md:flex md:justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#101820] bg-white text-sm font-black text-[#2563eb] shadow-[0_0_32px_rgba(96,165,250,0.55)]">
                        {number}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="proof" className="proof-section overflow-hidden bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="reveal">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#2563eb]">Real product proof</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">A dashboard managers can actually use.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Owners can see lead volume, active deals, lead sources, conversion movement, won/lost decisions, and salesperson performance.
            </p>
            <div className="mt-6 grid gap-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Icon className="mt-0.5 shrink-0 text-[#2563eb]" size={21} aria-hidden="true" />
                  <div>
                    <p className="font-black">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="proof-screen reveal rounded-xl border border-slate-200 bg-slate-100 p-3 shadow-2xl">
            <img
              src="/landing/crm-dashboard.png"
              alt="BuildFlow CRM dashboard showing leads, conversion funnel, sources, and revenue"
              className="w-full rounded-lg border border-slate-200 bg-white"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="reveal rounded-lg bg-[#111827] p-6 text-white lg:col-span-2">
            <Sparkles className="text-blue-300" size={28} aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">AI that helps salespeople move faster.</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/72">
              BuildFlow writes follow-up messages, call scripts, WhatsApp copy, meeting summaries, and proposal drafts from real lead notes.
            </p>
          </article>
          <article id="demo-safe" className="reveal rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <ShieldCheck className="text-[#2563eb]" size={28} aria-hidden="true" />
            <h3 className="mt-4 text-2xl font-black">Safe public demo</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Email sending stays mocked for visitors, and AI usage is capped so the demo remains safe to share in a portfolio.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#101820] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">Ready to inspect</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Open the live CRM demo.</h2>
            <p className="mt-3 text-white/70">Use seeded demo users and explore the full construction sales workflow.</p>
          </div>
          <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-[#111827] transition hover:bg-blue-50">
            Launch Demo <CheckCircle2 size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
