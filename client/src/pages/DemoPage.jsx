import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import MarketingNav from "../components/MarketingNav";
import MarketingFooter from "../components/MarketingFooter";
import Seo from "../seo";
import { colors, gradients, fonts, radius, glassCss } from "../theme";

// DemoPage. An auto-playing walkthrough for the public site. Runs fully in the
// browser (no backend, no login) so the URL can be shared with reviewers.
// One story runs top to bottom: 412 companies, filter to 38, score them, rank
// the survivors. Counts and names stay consistent across every section.
// All figures are illustrative.

// Sample slice shown in the screener (real large-caps, plausible fake numbers).
const SAMPLE = [
  { sym: "TCS", name: "Tata Consultancy", sector: "IT", cmp: "3,890", roe: 51.2, de: 0.09, pe: 30, growth: 7, score: 92 },
  { sym: "NEST", name: "Nestle India", sector: "FMCG", cmp: "2,510", roe: 68.4, de: 0.02, pe: 68, growth: 9, score: 89 },
  { sym: "INFY", name: "Infosys", sector: "IT", cmp: "1,620", roe: 31.8, de: 0.09, pe: 26, growth: 5, score: 87 },
  { sym: "APNT", name: "Asian Paints", sector: "FMCG", cmp: "2,880", roe: 27.4, de: 0.05, pe: 55, growth: 4, score: 84 },
  { sym: "PIDI", name: "Pidilite Ind.", sector: "Chemicals", cmp: "2,780", roe: 24.5, de: 0.06, pe: 60, growth: 11, score: 82 },
  { sym: "ITC", name: "ITC Ltd", sector: "FMCG", cmp: "472", roe: 28.6, de: 0.0, pe: 27, growth: 8, score: 80 },
  { sym: "HDFCB", name: "HDFC Bank", sector: "Banks", cmp: "1,690", roe: 17.1, de: 6.2, pe: 19, growth: 20, score: null },
  { sym: "RELI", name: "Reliance Ind.", sector: "Energy", cmp: "2,940", roe: 8.9, de: 0.44, pe: 24, growth: 12, score: null },
];

const FULL_QUERY = "ROE > 15 AND D/E < 0.5";
const passes = (c) => c.roe > 15 && c.de < 0.5; // 6 of the 8 shown
const TOTAL = 412;
const MATCH = 38;

const RANKED = SAMPLE.filter(passes).sort((a, b) => b.score - a.score);

// Cell colour helpers for the ranked report (green strong, amber ok, red weak).
const roeClass = (v) => (v >= 25 ? "good" : v >= 15 ? "mid" : "bad");
const deClass = (v) => (v <= 0.3 ? "good" : v <= 1 ? "mid" : "bad");
const grClass = (v) => (v >= 8 ? "good" : v >= 3 ? "mid" : "bad");

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] },
});

function Counter({ to, revealed, decimals = 0, className }) {
  const [val, setVal] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!revealed) return;
    if (reduce) { setVal(to); return; }
    let raf;
    const start = performance.now();
    const dur = 900;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [revealed, to, reduce]);
  return <span className={className}>{val.toFixed(decimals)}</span>;
}

// Screener demo: a formula types itself and the list narrows to the matches.
function ScreenerDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-80px" });
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [filtered, setFiltered] = useState(false);
  const [count, setCount] = useState(TOTAL);

  useEffect(() => {
    if (reduce) { setTyped(FULL_QUERY); setFiltered(true); setCount(MATCH); return; }
    if (!inView) return;

    let timers = [];
    let raf;
    let cancelled = false;

    const run = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      setTyped("");
      setFiltered(false);
      setCount(TOTAL);

      for (let i = 1; i <= FULL_QUERY.length; i++) {
        timers.push(setTimeout(() => setTyped(FULL_QUERY.slice(0, i)), 48 * i));
      }
      const typeDone = 48 * FULL_QUERY.length + 420;

      timers.push(setTimeout(() => {
        setFiltered(true);
        const start = performance.now();
        const dur = 750;
        const stepC = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          setCount(Math.round(TOTAL + (MATCH - TOTAL) * eased));
          if (t < 1 && !cancelled) raf = requestAnimationFrame(stepC);
        };
        raf = requestAnimationFrame(stepC);
      }, typeDone));

      timers.push(setTimeout(() => { if (!cancelled) run(); }, typeDone + 4200));
    };

    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); cancelAnimationFrame(raf); };
  }, [inView, reduce]);

  return (
    <div ref={ref} className="dv-card">
      <div className="dv-card-head">
        <span className="dv-dot" /><span className="dv-dot" /><span className="dv-dot" />
        <span className="dv-card-title">SCREENER</span>
        <span className="dv-badge">{count.toLocaleString("en-IN")} companies</span>
      </div>

      <div className="dv-filterbar">
        <span className="dv-filter-icon" aria-hidden="true">⌕</span>
        <span className="dv-filter-text">{typed}<span className="dv-caret" /></span>
        <span className={`dv-run ${filtered ? "on" : ""}`}>
          {filtered ? `Run on ${MATCH}` : "Run"} →
        </span>
      </div>

      <div className="dv-table" role="table" aria-label="Screener (illustrative)">
        <div className="dv-tr dv-th" role="row">
          <span>Company</span>
          <span className="dv-num">CMP ₹</span>
          <span className="dv-num">ROE %</span>
          <span className="dv-num">D/E</span>
          <span className="dv-num">P/E</span>
        </div>
        {SAMPLE.map((c) => {
          const out = filtered && !passes(c);
          const hit = filtered && passes(c);
          return (
            <div key={c.sym} className={`dv-tr ${out ? "out" : ""} ${hit ? "hit" : ""}`} role="row">
              <span className="dv-co"><b>{c.sym}</b><em>{c.name}</em></span>
              <span className="dv-num">{c.cmp}</span>
              <span className={`dv-num ${hit ? "ok" : ""}`}>{c.roe.toFixed(1)}</span>
              <span className={`dv-num ${hit ? "ok" : ""}`}>{c.de.toFixed(2)}</span>
              <span className="dv-num">{c.pe}</span>
            </div>
          );
        })}
      </div>

      <div className="dv-cardfoot">
        <span className={`dv-pill ${filtered ? "on" : ""}`}>{filtered ? `${MATCH} match` : "no filter"}</span>
        <span className="dv-foot-note">
          {filtered ? `Ranker runs on all ${MATCH} companies, not just this page.` : `Filter ${TOTAL} companies with a plain formula.`}
        </span>
      </div>
    </div>
  );
}

// Pipeline bridge: three stages fill in order, carrying the 38 row batch.
const STAGES = [
  { n: "1", title: "Format", desc: "Your export is cleaned and columns are mapped for you.", tag: "38 rows" },
  { n: "2", title: "Map sectors", desc: "Each company lands in its sector and KPI template.", tag: "38 mapped" },
  { n: "3", title: "Score", desc: "Every KPI is ranked by your rule and weighted into one score.", tag: "38 scored" },
];

function PipelineDemo() {
  const ref = useRef(null);
  const on = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="dv-pipeline">
      <div className="dv-pipe-line" aria-hidden="true" />
      {STAGES.map((s, i) => (
        <div key={s.n} className={`dv-stage ${on ? "on" : ""}`} style={{ transitionDelay: `${i * 0.45}s` }}>
          <div className="dv-stage-top">
            <div className="dv-stage-n">{s.n}</div>
            <span className="dv-stage-check" style={{ transitionDelay: `${i * 0.45 + 0.8}s` }}>✓</span>
          </div>
          <div className="dv-stage-title">{s.title}</div>
          <div className="dv-stage-desc">{s.desc}</div>
          <div className="dv-stage-bar"><span style={{ transitionDelay: `${i * 0.45 + 0.15}s` }} /></div>
          <div className="dv-stage-tag">{s.tag}</div>
        </div>
      ))}
    </div>
  );
}

// Results demo: colour-coded ranked report plus the score breakdown for #1.
const BREAKDOWN = [
  { label: "Return on equity", pct: 97 },
  { label: "Operating margin", pct: 92 },
  { label: "Low leverage", pct: 95 },
  { label: "Sales growth", pct: 74 },
  { label: "Valuation", pct: 68 },
];

function ResultsDemo() {
  const ref = useRef(null);
  const on = useInView(ref, { once: true, margin: "-80px" });
  const top = RANKED[0];
  return (
    <div ref={ref} className="dv-results">
      <div className="dv-card dv-ranked">
        <div className="dv-card-head">
          <span className="dv-dot" /><span className="dv-dot" /><span className="dv-dot" />
          <span className="dv-card-title">RANKED_REPORT.XLSX</span>
          <span className="dv-badge dv-badge-xls">Excel export</span>
        </div>
        <div className="dv-rank-th">
          <span>#</span><span>Company</span>
          <span className="dv-num">ROE</span><span className="dv-num">Growth</span><span className="dv-num">D/E</span>
          <span className="dv-num">Score</span>
        </div>
        {RANKED.map((c, i) => (
          <div className="dv-rank-row" key={c.sym}>
            <span className="dv-rank-n">{i + 1}</span>
            <span className="dv-rank-co"><b>{c.sym}</b><em>{c.name}</em></span>
            <span className={`dv-cell ${roeClass(c.roe)}`}>{c.roe.toFixed(0)}</span>
            <span className={`dv-cell ${grClass(c.growth)}`}>{c.growth}%</span>
            <span className={`dv-cell ${deClass(c.de)}`}>{c.de.toFixed(2)}</span>
            <span className="dv-rank-scorewrap">
              <span className="dv-rank-bar"><span style={{ width: on ? `${c.score}%` : 0, transitionDelay: `${i * 0.08}s` }} /></span>
              <Counter to={c.score} revealed={on} className="dv-rank-score" />
            </span>
          </div>
        ))}
      </div>

      <div className="dv-card dv-why">
        <div className="dv-why-head">
          <span className="dv-why-sym">Why {top.sym} ranks first</span>
          <span className="dv-why-score"><Counter to={top.score} revealed={on} />/100</span>
        </div>
        <div className="dv-why-note">Percentile against the full universe on each KPI.</div>
        {BREAKDOWN.map((b, i) => (
          <div className="dv-why-row" key={b.label}>
            <span className="dv-why-label">{b.label}</span>
            <span className="dv-why-track"><span style={{ width: on ? `${b.pct}%` : 0, transitionDelay: `${0.2 + i * 0.09}s` }} /></span>
            <span className="dv-why-pct">{b.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact strip of the rest of the product, kept concrete and short.
const ALSO = [
  { icon: ["M3 3v18h18", "M7 14l4-4 3 3 5-6"], title: "Compare 2 to 6 companies", desc: "Radar, leaderboard and scatter views side by side." },
  { icon: ["M21 21l-4.35-4.35", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"], title: "Open any company", desc: "Live price, fundamentals and price charts on one page." },
  { icon: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h5"], title: "Export to Excel or PDF", desc: "Colour-coded workbook, or a summary emailed to your inbox." },
];

function AlsoStrip() {
  return (
    <div className="dv-also">
      {ALSO.map((a, i) => (
        <motion.div key={a.title} {...fadeUp((i % 3) * 0.06)} className="dv-also-card">
          <div className="dv-also-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {a.icon.map((p, j) => <path key={j} d={p} />)}
            </svg>
          </div>
          <div className="dv-also-title">{a.title}</div>
          <div className="dv-also-desc">{a.desc}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function DemoPage() {
  return (
    <div style={{ color: colors.text, fontFamily: fonts.sans, minHeight: "100vh", overflowX: "hidden" }}>
      <Seo
        title="Demo"
        path="/demo"
        description="See ThinkVest work end to end. Filter hundreds of stocks with a plain formula, score them on your own KPIs, and get a ranked, colour-coded Excel report. No sign-up needed to watch."
      />
      <style>{DEMO_CSS}</style>
      <MarketingNav />

      {/* Hero */}
      <section className="dv-hero">
        <div className="dv-orb dv-orb-a" aria-hidden="true" />
        <div className="dv-orb dv-orb-b" aria-hidden="true" />
        <motion.div {...fadeUp(0)} className="dv-eyebrow">
          <span className="dv-eyebrow-dot" /> Watch it work, no sign-up
        </motion.div>
        <motion.h1 {...fadeUp(0.06)} className="dv-title">
          From 400 stocks to<br /><span className="dv-grad">your top six.</span>
        </motion.h1>
        <motion.p {...fadeUp(0.12)} className="dv-sub">
          Filter the market with a plain formula, score every company on the KPIs
          you trust, and download a ranked report. Here is the real workflow.
        </motion.p>
        <motion.div {...fadeUp(0.18)} className="dv-cta">
          <Link to="/signup" className="dv-btn dv-btn-solid">Create free account <span className="dv-arrow">→</span></Link>
          <Link to="/pricing" className="dv-btn dv-btn-ghost">See pricing</Link>
        </motion.div>
        <motion.p {...fadeUp(0.24)} className="dv-trust">Free for 90 days. No credit card.</motion.p>
      </section>

      {/* Step 1: Screener */}
      <section className="dv-section">
        <motion.div {...fadeUp(0)} className="dv-step">Step 1</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="dv-h2">Screen the whole market</motion.h2>
        <motion.p {...fadeUp(0.08)} className="dv-lead">
          Type a plain formula and the list narrows on the spot. Then run the ranker
          on exactly the companies that pass.
        </motion.p>
        <motion.div {...fadeUp(0.12)}><ScreenerDemo /></motion.div>
        <motion.div {...fadeUp(0.16)} className="dv-chips">
          <span className="dv-chip">ROE &gt; 15 AND D/E &lt; 1</span>
          <span className="dv-chip">Sector = Banks</span>
          <span className="dv-chip">Sales growth &gt;= 10</span>
          <span className="dv-chip">Search by name or ticker</span>
        </motion.div>
      </section>

      {/* Step 2: Pipeline */}
      <section className="dv-section">
        <motion.div {...fadeUp(0)} className="dv-step">Step 2</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="dv-h2">Score them in one pass</motion.h2>
        <motion.p {...fadeUp(0.08)} className="dv-lead">
          Cleaning, sector mapping and KPI scoring run together on one click. Your
          weights, your rules. The scoring logic stays on our servers.
        </motion.p>
        <motion.div {...fadeUp(0.12)}><PipelineDemo /></motion.div>
      </section>

      {/* Step 3: Results */}
      <section className="dv-section dv-section-wide">
        <motion.div {...fadeUp(0)} className="dv-step">Step 3</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="dv-h2">Get a report you can defend</motion.h2>
        <motion.p {...fadeUp(0.08)} className="dv-lead">
          Every company gets a score out of 100, built from your weighted KPIs.
          Green is strong, red is weak, and every rank traces back to a number.
        </motion.p>
        <motion.div {...fadeUp(0.12)}><ResultsDemo /></motion.div>
      </section>

      {/* Also included */}
      <section className="dv-section">
        <motion.h2 {...fadeUp(0)} className="dv-h2" style={{ marginBottom: 34 }}>And once you are in</motion.h2>
        <AlsoStrip />
      </section>

      {/* Closing CTA */}
      <section className="dv-footcta">
        <div className="dv-orb dv-orb-c" aria-hidden="true" />
        <motion.div {...fadeUp(0)} style={{ position: "relative" }}>
          <h2 className="dv-h2" style={{ marginBottom: 12 }}>Rank your own universe today</h2>
          <p className="dv-sub" style={{ margin: "0 auto 26px" }}>Free for 90 days. No credit card, cancel anytime.</p>
          <Link to="/signup" className="dv-btn dv-btn-solid dv-btn-lg">Create free account <span className="dv-arrow">→</span></Link>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}

const DEMO_CSS = `
  .dv-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 15px; border-radius: ${radius.pill}; padding: 14px 28px; transition: all .15s ease; cursor: pointer; border: 1px solid transparent; }
  .dv-btn-lg { padding: 15px 32px; }
  .dv-btn-solid { background: ${gradients.brand}; color: #fff; box-shadow: 0 4px 18px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.22); }
  .dv-btn-solid:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.22); filter: brightness(1.08); }
  .dv-btn-ghost { background: ${colors.glass}; color: ${colors.text}; border-color: ${colors.glassBorder}; backdrop-filter: blur(8px); }
  .dv-btn-ghost:hover { border-color: ${colors.accent}; background: ${colors.accentSoft}; }
  .dv-arrow { transition: transform .15s ease; }
  .dv-btn:hover .dv-arrow { transform: translateX(3px); }

  /* Hero */
  .dv-hero { position: relative; text-align: center; padding: 84px 24px 46px; overflow: hidden; }
  .dv-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; animation: dvFloat 14s ease-in-out infinite alternate; }
  .dv-orb-a { width: 500px; height: 500px; top: -180px; left: 50%; margin-left: -440px; background: rgba(16,185,129,0.20); }
  .dv-orb-b { width: 400px; height: 400px; top: -80px; left: 50%; margin-left: 80px; background: rgba(34,211,238,0.10); animation-delay: -7s; }
  .dv-orb-c { width: 460px; height: 460px; bottom: -240px; left: 50%; margin-left: -230px; background: rgba(16,185,129,0.14); }
  @keyframes dvFloat { from { transform: translateY(-14px); } to { transform: translateY(22px); } }

  .dv-eyebrow { position: relative; display: inline-flex; align-items: center; gap: 9px; font-family: ${fonts.mono}; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: ${colors.accentHover}; margin-bottom: 24px; padding: 8px 16px; border-radius: ${radius.pill}; background: ${colors.accentSoft}; border: 1px solid rgba(16,185,129,0.25); }
  .dv-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: ${colors.accent}; box-shadow: 0 0 10px ${colors.accent}; animation: dvPulse 2.2s ease-in-out infinite; }
  @keyframes dvPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

  .dv-title { position: relative; font-family: ${fonts.display}; font-size: clamp(40px, 7vw, 76px); font-weight: 700; line-height: 1.03; letter-spacing: -0.025em; margin: 0; }
  .dv-grad { background: ${gradients.textBright}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .dv-sub { position: relative; max-width: 560px; margin: 26px auto 0; color: ${colors.textSecondary}; font-size: 18px; line-height: 1.65; }
  .dv-cta { position: relative; display: flex; gap: 14px; justify-content: center; margin-top: 34px; }
  .dv-trust { position: relative; margin-top: 18px; font-size: 13px; color: ${colors.textMuted}; font-family: ${fonts.mono}; letter-spacing: .02em; }

  /* Sections */
  .dv-section { position: relative; max-width: 940px; margin: 0 auto; padding: 60px 40px; }
  .dv-section-wide { max-width: 1060px; }
  .dv-step { font-family: ${fonts.mono}; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: ${colors.accentHover}; text-align: center; margin-bottom: 12px; }
  .dv-h2 { font-family: ${fonts.display}; font-size: clamp(28px, 4vw, 42px); font-weight: 700; line-height: 1.12; letter-spacing: -0.015em; text-align: center; margin: 0 0 14px; color: ${colors.text}; }
  .dv-lead { text-align: center; max-width: 560px; margin: 0 auto 32px; color: ${colors.textSecondary}; font-size: 16px; line-height: 1.6; }

  /* Card shell */
  .dv-card { position: relative; border-radius: ${radius.lg}; overflow: hidden; ${glassCss} box-shadow: 0 30px 80px rgba(0,0,0,0.22), 0 0 70px rgba(16,185,129,0.06); }
  .dv-card-head { display: flex; align-items: center; gap: 7px; padding: 13px 18px; border-bottom: 1px solid ${colors.glassBorder}; }
  .dv-dot { width: 9px; height: 9px; border-radius: 50%; background: ${colors.elevated}; border: 1px solid ${colors.glassBorder}; }
  .dv-card-title { margin-left: 10px; font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .14em; color: ${colors.textMuted}; }
  .dv-badge { margin-left: auto; font-family: ${fonts.mono}; font-size: 11px; color: ${colors.accentHover}; background: ${colors.accentSoft}; border: 1px solid rgba(16,185,129,0.25); padding: 4px 10px; border-radius: ${radius.pill}; font-feature-settings: "tnum" 1; }
  .dv-badge-xls { color: ${colors.positive}; }
  .dv-cardfoot { display: flex; align-items: center; gap: 12px; padding: 12px 18px 15px; border-top: 1px solid ${colors.glassBorder}; }
  .dv-pill { font-family: ${fonts.mono}; font-size: 11px; color: ${colors.textMuted}; background: ${colors.inset}; padding: 4px 10px; border-radius: ${radius.pill}; transition: all .3s ease; }
  .dv-pill.on { color: ${colors.accentHover}; background: ${colors.accentSoft}; }
  .dv-foot-note { font-size: 12px; color: ${colors.textMuted}; }

  /* Screener filter bar */
  .dv-filterbar { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid ${colors.glassBorder}; background: ${colors.inset}; }
  .dv-filter-icon { color: ${colors.textMuted}; font-size: 16px; }
  .dv-filter-text { flex: 1; font-family: ${fonts.mono}; font-size: 13px; color: ${colors.text}; min-height: 18px; }
  .dv-caret { display: inline-block; width: 2px; height: 15px; margin-left: 2px; vertical-align: -2px; background: ${colors.accent}; animation: dvBlink 1s step-end infinite; }
  @keyframes dvBlink { 50% { opacity: 0; } }
  .dv-run { font-family: ${fonts.sans}; font-size: 12px; font-weight: 600; color: ${colors.textMuted}; padding: 6px 12px; border-radius: ${radius.pill}; border: 1px solid ${colors.glassBorder}; transition: all .3s ease; white-space: nowrap; }
  .dv-run.on { color: #fff; background: ${gradients.brand}; border-color: transparent; box-shadow: 0 4px 14px rgba(16,185,129,0.35); }

  /* Screener table */
  .dv-table { padding: 6px 6px 4px; }
  .dv-tr { display: grid; grid-template-columns: 1.9fr 0.9fr 0.85fr 0.75fr 0.7fr; align-items: center; gap: 10px; padding: 11px 14px; border-radius: ${radius.sm}; transition: opacity .5s ease, background .5s ease, box-shadow .5s ease; }
  .dv-th { font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: ${colors.textMuted}; padding-top: 8px; padding-bottom: 8px; }
  .dv-tr.out { opacity: .24; }
  .dv-tr.hit { background: ${colors.accentSoft}; box-shadow: inset 3px 0 0 ${colors.accent}; }
  .dv-co { display: flex; flex-direction: column; line-height: 1.25; overflow: hidden; }
  .dv-co b { font-size: 13px; color: ${colors.text}; font-weight: 700; }
  .dv-co em { font-style: normal; font-size: 11px; color: ${colors.textMuted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dv-num { font-family: ${fonts.mono}; font-size: 12px; color: ${colors.textSecondary}; text-align: right; font-feature-settings: "tnum" 1; transition: color .4s ease; }
  .dv-num.ok { color: ${colors.accentHover}; font-weight: 600; }

  /* Ranked report */
  .dv-results { display: grid; grid-template-columns: 1.35fr 1fr; gap: 18px; align-items: start; }
  .dv-ranked { padding-bottom: 8px; }
  .dv-rank-th, .dv-rank-row { display: grid; grid-template-columns: 26px 1.5fr 0.7fr 0.8fr 0.7fr 1.5fr; align-items: center; gap: 10px; padding: 10px 18px; }
  .dv-rank-th { font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: ${colors.textMuted}; border-bottom: 1px solid ${colors.glassBorder}; }
  .dv-rank-row + .dv-rank-row { border-top: 1px solid ${colors.borderSubtle}; }
  .dv-rank-n { font-family: ${fonts.mono}; font-size: 13px; color: ${colors.accentHover}; font-weight: 600; }
  .dv-rank-co { display: flex; flex-direction: column; line-height: 1.2; overflow: hidden; }
  .dv-rank-co b { font-size: 13px; color: ${colors.text}; font-weight: 700; }
  .dv-rank-co em { font-style: normal; font-size: 11px; color: ${colors.textMuted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dv-cell { font-family: ${fonts.mono}; font-size: 12px; text-align: right; font-feature-settings: "tnum" 1; padding: 3px 7px; border-radius: 6px; }
  .dv-cell.good { color: ${colors.positive}; background: ${colors.positiveSoft}; }
  .dv-cell.mid { color: ${colors.warning}; background: ${colors.warningSoft}; }
  .dv-cell.bad { color: ${colors.negative}; background: ${colors.negativeSoft}; }
  .dv-rank-scorewrap { display: flex; align-items: center; gap: 8px; }
  .dv-rank-bar { flex: 1; height: 7px; border-radius: 4px; background: ${colors.inset}; overflow: hidden; }
  .dv-rank-bar span { display: block; height: 100%; width: 0; border-radius: 4px; background: ${gradients.score}; transition: width .9s cubic-bezier(.21,.6,.35,1); }
  .dv-rank-score { font-family: ${fonts.mono}; font-size: 13px; color: ${colors.text}; font-weight: 700; width: 24px; text-align: right; font-feature-settings: "tnum" 1; }

  /* Why #1 */
  .dv-why { padding: 16px 20px 18px; }
  .dv-why-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .dv-why-sym { font-family: ${fonts.display}; font-size: 16px; font-weight: 700; color: ${colors.text}; }
  .dv-why-score { font-family: ${fonts.mono}; font-size: 15px; font-weight: 700; color: ${colors.accentHover}; }
  .dv-why-note { font-size: 12px; color: ${colors.textMuted}; margin: 4px 0 16px; }
  .dv-why-row { display: grid; grid-template-columns: 1fr 1.4fr 28px; align-items: center; gap: 10px; margin-bottom: 12px; }
  .dv-why-row:last-child { margin-bottom: 0; }
  .dv-why-label { font-size: 12px; color: ${colors.textSecondary}; }
  .dv-why-track { height: 8px; border-radius: 4px; background: ${colors.inset}; overflow: hidden; }
  .dv-why-track span { display: block; height: 100%; width: 0; border-radius: 4px; background: ${gradients.brand}; transition: width 1s cubic-bezier(.21,.6,.35,1); }
  .dv-why-pct { font-family: ${fonts.mono}; font-size: 12px; color: ${colors.text}; text-align: right; font-feature-settings: "tnum" 1; }

  /* Pipeline */
  .dv-pipeline { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .dv-pipe-line { position: absolute; top: 40px; left: 12%; right: 12%; height: 1px; background: linear-gradient(90deg, transparent, rgba(16,185,129,0.4), rgba(16,185,129,0.4), transparent); }
  .dv-stage { position: relative; border-radius: ${radius.md}; padding: 20px; text-align: left; ${glassCss} opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
  .dv-stage.on { opacity: 1; transform: translateY(0); }
  .dv-stage-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .dv-stage-n { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: ${radius.pill}; font-family: ${fonts.mono}; font-size: 13px; color: #fff; background: ${gradients.brand}; box-shadow: 0 0 18px rgba(16,185,129,0.4); }
  .dv-stage-check { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 11px; color: ${colors.positive}; background: ${colors.positiveSoft}; opacity: 0; transform: scale(.5); transition: opacity .4s ease, transform .4s ease; }
  .dv-stage.on .dv-stage-check { opacity: 1; transform: scale(1); }
  .dv-stage-title { font-family: ${fonts.display}; font-size: 17px; font-weight: 700; color: ${colors.text}; margin-bottom: 6px; }
  .dv-stage-desc { font-size: 13px; color: ${colors.textSecondary}; line-height: 1.5; margin-bottom: 14px; }
  .dv-stage-bar { height: 6px; border-radius: 3px; background: ${colors.inset}; overflow: hidden; }
  .dv-stage-bar span { display: block; height: 100%; width: 0; border-radius: 3px; background: ${gradients.score}; transition: width .9s cubic-bezier(.21,.6,.35,1); }
  .dv-stage.on .dv-stage-bar span { width: 100%; }
  .dv-stage-tag { margin-top: 10px; font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .06em; color: ${colors.textMuted}; }

  /* Also included */
  .dv-also { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .dv-also-card { border-radius: ${radius.md}; padding: 24px 22px; transition: transform .15s ease, box-shadow .15s ease; ${glassCss} }
  .dv-also-card:hover { transform: translateY(-4px); box-shadow: 0 16px 44px rgba(0,0,0,0.22), 0 0 36px rgba(16,185,129,0.1); }
  .dv-also-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: ${radius.sm}; background: ${colors.accentSoft}; color: ${colors.accentHover}; border: 1px solid rgba(16,185,129,0.25); margin-bottom: 14px; }
  .dv-also-title { font-family: ${fonts.display}; font-size: 16px; font-weight: 700; margin-bottom: 6px; color: ${colors.text}; }
  .dv-also-desc { font-size: 13px; color: ${colors.textSecondary}; line-height: 1.55; }

  /* Chips */
  .dv-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 24px; }
  .dv-chip { font-family: ${fonts.mono}; font-size: 12px; color: ${colors.textSecondary}; padding: 8px 14px; border-radius: ${radius.pill}; border: 1px solid ${colors.borderSubtle}; background: ${colors.glass}; }

  /* Footer CTA */
  .dv-footcta { position: relative; text-align: center; padding: 96px 24px; overflow: hidden; border-top: 1px solid ${colors.borderSubtle}; }

  @media (max-width: 860px) {
    .dv-results { grid-template-columns: 1fr; }
    .dv-pipeline { grid-template-columns: 1fr; }
    .dv-pipe-line { display: none; }
    .dv-also { grid-template-columns: 1fr; }
    .dv-section { padding: 46px 20px; }
  }
  @media (max-width: 560px) {
    .dv-tr { grid-template-columns: 1.7fr 0.8fr 0.8fr; }
    .dv-tr > span:nth-child(2), .dv-tr > span:nth-child(5) { display: none; }
    .dv-rank-th, .dv-rank-row { grid-template-columns: 22px 1.4fr 0.7fr 1.3fr; }
    .dv-rank-th > span:nth-child(3), .dv-rank-th > span:nth-child(4),
    .dv-rank-row > span:nth-child(3), .dv-rank-row > span:nth-child(4) { display: none; }
    .dv-cta { flex-direction: column; align-items: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .dv-orb, .dv-eyebrow-dot, .dv-caret { animation: none; }
    .dv-stage, .dv-stage-bar span, .dv-stage-check, .dv-rank-bar span, .dv-why-track span { transition: none; }
  }
`;
