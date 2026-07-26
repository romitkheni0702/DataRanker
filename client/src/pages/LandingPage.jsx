import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import MarketingNav from "../components/MarketingNav";
import MarketingFooter from "../components/MarketingFooter";
import Seo from "../seo";
import { apiUrl } from "../api";
import { colors, gradients, fonts, radius, glassCss } from "../theme";

const CONTACT_EMAIL = "connect@thinkvest.in";

const WORKFLOW = [
  { n: "01", title: "Upload Screener Data", desc: "Drop in your Screener.in CSV export. KPI library and sector mapping are managed server-side, so there is nothing else to configure." },
  { n: "02", title: "Filter Your Universe", desc: "Use the live screener to slice by any metric with a formula DSL, then run on exactly the companies you want." },
  { n: "03", title: "Run Pipeline", desc: "One click formats, sector-maps and scores your universe in a single pass against your KPI templates." },
  { n: "04", title: "Download Rankings", desc: "A colour-coded, multi-sheet ranked Excel report, ready to open, audit and share immediately." },
];

const FEATURES = [
  { icon: ["M4 6h16", "M4 12h10", "M4 18h7", "M16 15l4 3-4 3"], title: "Smart column mapping", desc: "Auto-matches your CSV headers to the canonical schema. No manual mapping required for standard Screener.in exports." },
  { icon: ["M3 3v18h18", "M7 14l4-4 3 3 5-6"], title: "Direction-aware scoring", desc: "Every KPI is ranked by its own higher/lower-is-better rule and weighted into one defensible, auditable score." },
  { icon: ["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"], title: "190 to 130 sector mapping", desc: "Industries are mapped to your SCS sectors and KPI templates automatically before ranking. No manual join required." },
  { icon: ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"], title: "Live screener", desc: "Filter your daily universe with a formula DSL (ROE > 15 AND Sector = Banks), compare companies, then pipeline the results." },
  { icon: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h5"], title: "Excel-native output", desc: "A colour-coded, multi-sheet ranked report you can open, audit and share immediately. No post-processing needed." },
  { icon: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"], title: "Editable KPI library", desc: "Tune templates, weights and directions in-app. Changes apply on the next pipeline run, with no spreadsheets to wrangle." },
];

// Mirrors the Pricing page shape so the landing cards render even when the
// backend is unreachable. Live values come from GET /plans.
const FALLBACK_PLANS = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Everything you need to rank, analyse and compare stocks.",
    monthlyPrice: 499,
    yearlyPrice: 4999,
    monthlyDiscountedPrice: 0,
    yearlyDiscountedPrice: 0,
    yearlyDiscountPct: 17,
    trialDays: 90,
    highlighted: true,
    cta: "Start free trial",
    features: [
      "Rank any stock universe in minutes",
      "Composite scoring across profitability, valuation, growth and efficiency",
      "Filter stocks with simple formulas before you rank",
      "Compare 2 to 6 companies with radar, bar and percentile charts",
      "Customise KPI weights to match your investment style",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Advanced analytics, alerts, watchlists and AI interpretation.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyDiscountedPrice: 0,
    yearlyDiscountedPrice: 0,
    yearlyDiscountPct: 0,
    trialDays: 0,
    highlighted: false,
    cta: "Contact us to upgrade",
    features: [
      "Everything in Standard",
      "Sector benchmarking and leaderboard scoring",
      "Real-time alerts on earnings, downgrades and macro signals",
      "Custom stock watchlist",
      "AI interpretation engine for plain-language insights",
    ],
  },
];

const isContactPlan = (plan) => !plan.monthlyPrice && !plan.yearlyPrice;

// Returns { regular, discounted }. discounted is null when no discount is set.
function getPrices(plan, period) {
  if (period === "yearly") {
    return {
      regular: plan.yearlyPrice || 0,
      discounted: plan.yearlyDiscountedPrice > 0 ? plan.yearlyDiscountedPrice : null,
    };
  }
  return {
    regular: plan.monthlyPrice || 0,
    discounted: plan.monthlyDiscountedPrice > 0 ? plan.monthlyDiscountedPrice : null,
  };
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] },
});

function Glyph({ paths }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// Counts up to `value` the first time the tile scrolls into view.
function StatItem({ value, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setShown(value); return; }
    let raf;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1000);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  return (
    <div ref={ref} className="lp-stat-item">
      <div className="lp-stat-n">{shown.toLocaleString("en-IN")}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [stats, setStats] = useState(null);          // null until /stats responds
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [period, setPeriod] = useState("monthly");   // "monthly" | "yearly"
  const [sc, setSc] = useState({});                  // site content overrides

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/stats"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setStats(d); })
      .catch(() => {});
    fetch(apiUrl("/plans"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && Array.isArray(d) && d.length) setPlans(d); })
      .catch(() => {});
    fetch(apiUrl("/site-content"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.landing) setSc(d.landing); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const trialDays = useMemo(
    () => Math.max(0, ...plans.map((p) => p.trialDays || 0)),
    [plans]
  );
  const maxYearlyDiscount = useMemo(
    () => Math.max(0, ...plans.map((p) => p.yearlyDiscountPct || 0)),
    [plans]
  );
  const entryPlan = useMemo(
    () => plans.find((p) => !isContactPlan(p)) || plans[0],
    [plans]
  );

  // Answers track the live plan data so the copy can never drift from pricing.
  const faq = useMemo(() => [
    {
      q: "What do I need to get started?",
      a: "Just your Screener.in CSV export. Industry mapping and your KPI library are managed server-side, so ThinkVest handles everything else.",
    },
    {
      q: "Is my methodology safe?",
      a: "Your KPI weights and ranking logic stay in your workspace. The pipeline runs your templates exactly as you define them.",
    },
    {
      q: trialDays > 0 ? `What does the ${trialDays}-day free trial include?` : "What does the trial include?",
      a: `Full access to the ranking pipeline, live screener, comparison dashboard, KPI editor and Excel export. No credit card is required to start${
        entryPlan && entryPlan.monthlyPrice
          ? `, and ${entryPlan.name} is ₹${entryPlan.monthlyPrice.toLocaleString("en-IN")} per month afterwards.`
          : "."
      }`,
    },
    {
      q: "Can I change the scoring later?",
      a: "Yes. Edit templates, weights and directions in the KPI editor and re-run the pipeline any time.",
    },
    {
      q: "Can I see it work before signing up?",
      a: "Yes. The demo walks through the full flow in your browser with sample data, with no sign-up needed.",
    },
  ], [trialDays, entryPlan]);

  // Escape "<" so admin-editable plan text can never close the script tag.
  const faqSchema = useMemo(() => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  }).replace(/</g, "\\u003c"), [faq]);

  return (
    <div style={{ color: colors.text, fontFamily: fonts.sans, minHeight: "100vh", overflowX: "hidden" }}>
      <Seo
        path="/"
        description="ThinkVest turns raw equity fundamentals into a defensible, weighted ranking, mapped to your sectors and scored against your KPI templates. Think. Research. Analyse. Invest."
      />
      <style>{LANDING_CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />

      <MarketingNav />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-a" aria-hidden="true" />
        <div className="lp-orb lp-orb-b" aria-hidden="true" />
        <motion.div {...fadeUp(0)} className="lp-eyebrow">
          <span className="lp-eyebrow-dot" />
          {sc.heroEyebrow || "Think · Research · Analyse · Invest"}
        </motion.div>
        <motion.h1 {...fadeUp(0.06)} className="lp-title">
          {sc.heroTitle || "Rank every company."}<br />
          <span className="lp-grad">{sc.heroTitleAccent || "With precision."}</span>
        </motion.h1>
        <motion.p {...fadeUp(0.12)} className="lp-sub">
          {sc.heroSubtitle || "ThinkVest turns raw fundamentals into a defensible, weighted ranking, mapped to your sectors and scored against your KPI templates."}
        </motion.p>
        <motion.div {...fadeUp(0.18)} className="lp-cta">
          <Link to="/signup" className="lp-btn lp-btn-solid lp-btn-lg">
            {trialDays > 0 ? `Start ${trialDays}-day free trial` : "Get Started"} <span className="lp-btn-arrow">→</span>
          </Link>
          <Link to="/demo" className="lp-btn lp-btn-ghost lp-btn-lg">Watch the demo</Link>
        </motion.div>

        {/* Hero panel. Illustrative preview that opens the full walkthrough. */}
        <motion.div {...fadeUp(0.28)}>
          <Link to="/demo" className="lp-panel" aria-label="Watch the ThinkVest demo walkthrough">
            <div className="lp-panel-head">
              <span className="lp-panel-dot" /><span className="lp-panel-dot" /><span className="lp-panel-dot" />
              <span className="lp-panel-title">FINAL_RANKED_REPORT.XLSX</span>
              <span className="lp-panel-cue">Watch the demo →</span>
            </div>
            {[92, 81, 74, 63, 55].map((w, i) => (
              <div className="lp-panel-row" key={i}>
                <span className="lp-panel-rank">#{i + 1}</span>
                <span className="lp-panel-ticker" aria-hidden="true">{"▮▮▮▮▮▮".slice(0, 6 - i)}</span>
                <span className="lp-panel-bar">
                  <motion.span
                    initial={{ width: 0 }}
                    whileInView={{ width: `${w}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease: [0.21, 0.6, 0.35, 1] }}
                  />
                </span>
                <span className="lp-panel-score">{(w / 10).toFixed(1)}</span>
              </div>
            ))}
          </Link>
        </motion.div>
      </section>

      {/* Live stats strip. Rendered only when the backend actually answers. */}
      {stats && (
        <section className="lp-stats-strip">
          <StatItem value={stats.analysts || 0} label="Analysts signed up" />
          <StatItem value={stats.companies || 0} label="Companies in screener" />
          <StatItem value={stats.templates || 0} label="KPI templates" />
        </section>
      )}

      {/* Trusted-by strip */}
      <section className="lp-trust">
        <span className="lp-trust-label">Built for the workflow of</span>
        <div className="lp-trust-logos">
          {["Hedge funds", "Equity research", "Family offices", "PMS desks"].map((x) => (
            <span key={x} className="lp-trust-item">{x}</span>
          ))}
        </div>
      </section>

      {/* Workflow strip */}
      <section className="lp-section" id="how-it-works">
        <motion.div {...fadeUp(0)} className="lp-kicker">How it works</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="lp-h2">From export to ranking<br />in four steps</motion.h2>
        <div className="lp-flow">
          <div className="lp-flow-line" aria-hidden="true" />
          {WORKFLOW.map((s, i) => {
            const override = sc.workflow?.[i] || {};
            return (
              <motion.div key={s.n} {...fadeUp(i * 0.08)} className="lp-flow-card">
                <div className="lp-flow-n">{s.n}</div>
                <div className="lp-flow-title">{override.title || s.title}</div>
                <div className="lp-flow-desc">{override.desc  || s.desc}</div>
              </motion.div>
            );
          })}
        </div>
        <motion.div {...fadeUp(0.1)} className="lp-section-cta">
          <Link to="/demo" className="lp-btn lp-btn-ghost">
            See all four steps run <span className="lp-btn-arrow">→</span>
          </Link>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="lp-section" id="features">
        <motion.div {...fadeUp(0)} className="lp-kicker">Capabilities</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="lp-h2">Everything you need to<br />defend a ranking</motion.h2>
        <div className="lp-features">
          {FEATURES.map((f, i) => {
            const override = sc.features?.[i] || {};
            return (
              <motion.div key={f.title} {...fadeUp((i % 3) * 0.06)} className="lp-feature">
                <div className="lp-feature-icon"><Glyph paths={f.icon} /></div>
                <div className="lp-feature-title">{override.title || f.title}</div>
                <div className="lp-feature-desc">{override.desc  || f.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Pricing. Live plans from GET /plans with a working billing toggle. */}
      <section className="lp-section" id="pricing">
        <motion.div {...fadeUp(0)} className="lp-kicker">Pricing</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="lp-h2" style={{ marginBottom: 26 }}>
          Start free.<br />Scale when you&apos;re ready.
        </motion.h2>

        <motion.div {...fadeUp(0.08)} className="lp-toggle-row">
          <div className="lp-toggle-wrap" role="group" aria-label="Billing period">
            <button
              type="button"
              className={`lp-toggle-btn${period === "monthly" ? " active" : ""}`}
              onClick={() => setPeriod("monthly")}
              aria-pressed={period === "monthly"}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`lp-toggle-btn${period === "yearly" ? " active" : ""}`}
              onClick={() => setPeriod("yearly")}
              aria-pressed={period === "yearly"}
            >
              Yearly
              {maxYearlyDiscount > 0 && <span className="lp-toggle-badge">Save {maxYearlyDiscount}%</span>}
            </button>
          </div>
        </motion.div>

        <div className="lp-plans">
          {plans.map((plan, i) => {
            const contact = isContactPlan(plan);
            const { regular, discounted } = getPrices(plan, period);
            const showYearlyDiscount = period === "yearly" && plan.yearlyDiscountPct > 0;
            return (
              <motion.div
                key={plan.id || plan.planId || plan.name}
                {...fadeUp(i * 0.06)}
                className={`lp-plan${plan.highlighted ? " highlighted" : ""}`}
              >
                {plan.highlighted && <div className="lp-plan-badge">Most popular</div>}
                <div className="lp-plan-name">{plan.name}</div>
                {plan.trialDays > 0 && (
                  <div className="lp-plan-trial">{plan.trialDays}-day free trial</div>
                )}

                <div className="lp-plan-price">
                  {contact ? (
                    <span className="lp-plan-amt lp-plan-amt-sm">Contact us</span>
                  ) : discounted ? (
                    <>
                      <span className="lp-plan-strike">₹{regular.toLocaleString("en-IN")}</span>
                      <span className="lp-plan-amt lp-plan-amt-green">₹{discounted.toLocaleString("en-IN")}</span>
                      <span className="lp-plan-per">{period === "yearly" ? "/ year" : "/ month"}</span>
                    </>
                  ) : (
                    <>
                      <span className="lp-plan-amt">₹{regular.toLocaleString("en-IN")}</span>
                      <span className="lp-plan-per">{period === "yearly" ? "/ year" : "/ month"}</span>
                    </>
                  )}
                </div>

                {discounted && (
                  <div className="lp-plan-save">Special offer · Save ₹{(regular - discounted).toLocaleString("en-IN")}</div>
                )}
                {!discounted && showYearlyDiscount && (
                  <div className="lp-plan-save">Save {plan.yearlyDiscountPct}% vs monthly</div>
                )}

                {plan.tagline && <p className="lp-plan-tagline">{plan.tagline}</p>}

                <ul className="lp-plan-features">
                  {(plan.features || []).slice(0, 5).map((f) => (
                    <li key={f}><span className="lp-plan-tick">✓</span>{f}</li>
                  ))}
                </ul>
                {(plan.features || []).length > 5 && (
                  <div className="lp-plan-more">+ {plan.features.length - 5} more in this plan</div>
                )}

                {contact ? (
                  <a href={`mailto:${CONTACT_EMAIL}`} className="lp-btn lp-btn-ghost lp-plan-cta">
                    ✉ {plan.cta || "Contact us"}
                  </a>
                ) : (
                  <Link to="/signup" className="lp-btn lp-btn-solid lp-plan-cta">
                    {plan.cta || "Get started"}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div {...fadeUp(0.1)} className="lp-section-cta">
          <Link to="/pricing" className="lp-plans-compare">Compare every feature side by side →</Link>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="lp-section lp-faq-section" id="faq">
        <motion.div {...fadeUp(0)} className="lp-kicker">FAQ</motion.div>
        <motion.h2 {...fadeUp(0.04)} className="lp-h2">Questions, answered</motion.h2>
        <div className="lp-faq">
          {faq.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className={`lp-faq-item ${open ? "open" : ""}`}>
                <h3 className="lp-faq-h">
                  <button
                    type="button"
                    id={`lp-faq-q-${i}`}
                    className="lp-faq-q"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    aria-controls={`lp-faq-a-${i}`}
                  >
                    <span>{item.q}</span>
                    <span className="lp-faq-chev" aria-hidden="true">{open ? "−" : "+"}</span>
                  </button>
                </h3>
                <div
                  id={`lp-faq-a-${i}`}
                  role="region"
                  aria-labelledby={`lp-faq-q-${i}`}
                  className="lp-faq-a"
                  hidden={!open}
                >
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="lp-footcta">
        <div className="lp-orb lp-orb-c" aria-hidden="true" />
        <motion.div {...fadeUp(0)} style={{ position: "relative" }}>
          <h2 className="lp-h2" style={{ marginBottom: 22 }}>{sc.footerCta || "Ready to see your rankings?"}</h2>
          <div className="lp-cta">
            <Link to="/signup" className="lp-btn lp-btn-solid lp-btn-lg">
              {trialDays > 0 ? `Start ${trialDays}-day free trial` : "Get Started"} <span className="lp-btn-arrow">→</span>
            </Link>
            <Link to="/demo" className="lp-btn lp-btn-ghost lp-btn-lg">Watch the demo</Link>
          </div>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}

const LANDING_CSS = `
  .lp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 14px; border-radius: ${radius.pill}; padding: 10px 20px; transition: all .15s ease; cursor: pointer; border: 1px solid transparent; }
  .lp-btn-lg { padding: 15px 30px; font-size: 15px; }
  .lp-btn-solid { background: ${gradients.brand}; color: #fff; box-shadow: 0 4px 18px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.22); }
  .lp-btn-solid:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.22); filter: brightness(1.08); }
  .lp-btn-ghost { background: ${colors.glass}; color: ${colors.text}; border-color: ${colors.glassBorder}; backdrop-filter: blur(8px); }
  .lp-btn-ghost:hover { border-color: ${colors.accent}; background: ${colors.accentSoft}; }
  .lp-btn-arrow { transition: transform .15s ease; }
  .lp-btn:hover .lp-btn-arrow { transform: translateX(3px); }

  /* Live stats strip */
  .lp-stats-strip { display: flex; justify-content: center; gap: 0; border-top: 1px solid ${colors.glassBorder}; border-bottom: 1px solid ${colors.glassBorder}; background: ${colors.glass}; backdrop-filter: blur(12px); padding: 0 24px; }
  .lp-stat-item { flex: 1; max-width: 200px; text-align: center; padding: 28px 20px; border-right: 1px solid ${colors.glassBorder}; }
  .lp-stat-item:last-child { border-right: none; }
  .lp-stat-n { font-family: ${fonts.display}; font-size: 36px; font-weight: 700; color: ${colors.text}; letter-spacing: -0.03em; margin-bottom: 4px; font-feature-settings: "tnum" 1; }
  .lp-stat-label { font-size: 12px; color: ${colors.textMuted}; letter-spacing: .02em; }
  @media (max-width: 520px) { .lp-stat-n { font-size: 26px; } .lp-stat-item { padding: 20px 12px; } }

  .lp-hero { position: relative; text-align: center; padding: 90px 24px 80px; }
  .lp-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; animation: lpFloat 14s ease-in-out infinite alternate; }
  .lp-orb-a { width: 520px; height: 520px; top: -180px; left: 50%; margin-left: -460px; background: rgba(16,185,129,0.20); }
  .lp-orb-b { width: 420px; height: 420px; top: -60px; left: 50%; margin-left: 80px; background: rgba(34,211,238,0.10); animation-delay: -7s; }
  .lp-orb-c { width: 480px; height: 480px; bottom: -240px; left: 50%; margin-left: -240px; background: rgba(16,185,129,0.14); }
  @keyframes lpFloat { from { transform: translateY(-14px); } to { transform: translateY(22px); } }

  .lp-eyebrow { position: relative; display: inline-flex; align-items: center; gap: 9px; font-family: ${fonts.mono}; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: ${colors.accentHover}; margin-bottom: 26px; padding: 8px 16px; border-radius: ${radius.pill}; background: ${colors.accentSoft}; border: 1px solid rgba(16,185,129,0.25); }
  .lp-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: ${colors.accent}; box-shadow: 0 0 10px ${colors.accent}; animation: lpPulse 2.2s ease-in-out infinite; }
  @keyframes lpPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

  .lp-title { position: relative; font-family: ${fonts.display}; font-size: clamp(44px, 7.5vw, 86px); font-weight: 700; line-height: 1.02; letter-spacing: -0.025em; margin: 0; }
  .lp-grad { background: ${gradients.textBright}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .lp-sub { position: relative; max-width: 560px; margin: 28px auto 0; color: ${colors.textSecondary}; font-size: 18px; line-height: 1.65; }
  .lp-cta { position: relative; display: flex; gap: 14px; justify-content: center; margin-top: 40px; flex-wrap: wrap; }

  .lp-panel { position: relative; display: block; max-width: 620px; margin: 70px auto 0; border-radius: ${radius.lg}; padding: 0 0 14px; overflow: hidden; text-decoration: none; color: inherit; transition: transform .18s ease, box-shadow .18s ease; ${glassCss} box-shadow: 0 30px 80px rgba(0,0,0,0.25), 0 0 80px rgba(16,185,129,0.08); }
  .lp-panel:hover { transform: translateY(-4px); box-shadow: 0 36px 90px rgba(0,0,0,0.3), 0 0 90px rgba(16,185,129,0.16); }
  .lp-panel-head { display: flex; align-items: center; gap: 7px; padding: 14px 18px; border-bottom: 1px solid ${colors.glassBorder}; }
  .lp-panel-dot { width: 9px; height: 9px; border-radius: 50%; background: ${colors.elevated}; border: 1px solid ${colors.glassBorder}; }
  .lp-panel-title { margin-left: 10px; font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .14em; color: ${colors.textMuted}; }
  .lp-panel-cue { margin-left: auto; font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .1em; color: ${colors.accentHover}; opacity: 0; transition: opacity .18s ease; }
  .lp-panel:hover .lp-panel-cue { opacity: 1; }
  .lp-panel-row { display: grid; grid-template-columns: 44px 90px 1fr 44px; align-items: center; gap: 14px; padding: 11px 20px; }
  .lp-panel-row + .lp-panel-row { border-top: 1px solid ${colors.glassBorder}; }
  .lp-panel-rank { font-family: ${fonts.mono}; font-size: 12px; color: ${colors.accentHover}; text-align: left; }
  .lp-panel-ticker { font-family: ${fonts.mono}; font-size: 11px; color: ${colors.textMuted}; letter-spacing: 2px; }
  .lp-panel-bar { height: 6px; border-radius: 3px; background: ${colors.inset}; overflow: hidden; }
  .lp-panel-bar span { display: block; height: 100%; border-radius: 3px; background: ${gradients.score}; }
  .lp-panel-score { font-family: ${fonts.mono}; font-size: 12px; color: ${colors.text}; text-align: right; font-feature-settings: "tnum" 1; }

  .lp-trust { max-width: 1000px; margin: 0 auto; padding: 20px 40px 10px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .lp-trust-label { font-family: ${fonts.mono}; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: ${colors.textMuted}; }
  .lp-trust-logos { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
  .lp-trust-item { font-family: ${fonts.display}; font-weight: 600; font-size: 16px; color: ${colors.textSecondary}; opacity: .8; padding: 8px 16px; border-radius: ${radius.pill}; border: 1px solid ${colors.borderSubtle}; }

  .lp-section { position: relative; max-width: 1080px; margin: 0 auto; padding: 80px 40px; }
  .lp-kicker { font-family: ${fonts.mono}; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: ${colors.accentHover}; text-align: center; margin-bottom: 14px; }
  .lp-h2 { font-family: ${fonts.display}; font-size: clamp(28px, 4vw, 44px); font-weight: 700; line-height: 1.12; letter-spacing: -0.015em; text-align: center; margin: 0 0 48px; color: ${colors.text}; }
  .lp-section-cta { display: flex; justify-content: center; margin-top: 34px; }

  .lp-flow { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .lp-flow-line { position: absolute; top: 39px; left: 6%; right: 6%; height: 1px; background: linear-gradient(90deg, transparent, rgba(16,185,129,0.45), rgba(16,185,129,0.45), transparent); pointer-events: none; }
  .lp-flow-card { position: relative; border-radius: ${radius.md}; padding: 28px 22px; transition: transform .15s ease, box-shadow .15s ease; ${glassCss} }
  .lp-flow-card:hover { transform: translateY(-4px); box-shadow: 0 16px 44px rgba(0,0,0,0.25), 0 0 40px rgba(16,185,129,0.12); }
  .lp-flow-n { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: ${radius.pill}; font-family: ${fonts.mono}; font-size: 12px; color: #fff; background: ${gradients.brand}; box-shadow: 0 0 18px rgba(16,185,129,0.4); margin-bottom: 16px; }
  .lp-flow-title { font-family: ${fonts.display}; font-size: 17px; font-weight: 700; margin-bottom: 8px; color: ${colors.text}; }
  .lp-flow-desc { font-size: 14px; color: ${colors.textSecondary}; line-height: 1.55; }

  .lp-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  @media (max-width: 860px) { .lp-features { grid-template-columns: 1fr 1fr; } }
  .lp-feature { border-radius: ${radius.md}; padding: 28px 24px; transition: transform .15s ease, box-shadow .15s ease; ${glassCss} }
  .lp-feature:hover { transform: translateY(-4px); box-shadow: 0 16px 44px rgba(0,0,0,0.25), 0 0 40px rgba(16,185,129,0.12); }
  .lp-feature-icon { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: ${radius.sm}; background: ${colors.accentSoft}; color: ${colors.accentHover}; border: 1px solid rgba(16,185,129,0.25); margin-bottom: 18px; }
  .lp-feature-title { font-family: ${fonts.display}; font-size: 18px; font-weight: 700; margin-bottom: 8px; color: ${colors.text}; }
  .lp-feature-desc { font-size: 14px; color: ${colors.textSecondary}; line-height: 1.6; }

  /* Pricing */
  .lp-toggle-row { display: flex; justify-content: center; margin-bottom: 40px; }
  .lp-toggle-wrap { display: inline-flex; gap: 4px; padding: 5px; border-radius: ${radius.pill}; background: ${colors.inset}; border: 1px solid ${colors.borderSubtle}; }
  .lp-toggle-btn { display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; background: transparent; color: ${colors.textSecondary}; font-family: ${fonts.sans}; font-size: 14px; font-weight: 600; padding: 10px 22px; border-radius: ${radius.pill}; transition: all .15s ease; }
  .lp-toggle-btn:hover { color: ${colors.text}; }
  .lp-toggle-btn.active { background: ${gradients.brand}; color: #fff; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
  .lp-toggle-badge { font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .04em; padding: 3px 7px; border-radius: ${radius.pill}; background: ${colors.positiveSoft}; color: ${colors.positive}; }
  .lp-toggle-btn.active .lp-toggle-badge { background: rgba(255,255,255,0.22); color: #fff; }

  .lp-plans { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; max-width: 860px; margin: 0 auto; }
  .lp-plan { position: relative; display: flex; flex-direction: column; border-radius: ${radius.lg}; padding: 32px 28px; ${glassCss} }
  .lp-plan.highlighted { border-color: rgba(16,185,129,0.4); box-shadow: 0 20px 60px rgba(0,0,0,0.24), 0 0 50px rgba(16,185,129,0.12); }
  .lp-plan-badge { position: absolute; top: -11px; left: 28px; font-family: ${fonts.mono}; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; padding: 5px 12px; border-radius: ${radius.pill}; background: ${gradients.brand}; color: #fff; box-shadow: 0 4px 14px rgba(16,185,129,0.35); }
  .lp-plan-name { font-family: ${fonts.display}; font-size: 20px; font-weight: 700; color: ${colors.text}; margin-bottom: 8px; }
  .lp-plan-trial { display: inline-block; align-self: flex-start; font-family: ${fonts.mono}; font-size: 11px; padding: 4px 10px; border-radius: ${radius.pill}; background: ${colors.accentSoft}; color: ${colors.accentHover}; border: 1px solid rgba(16,185,129,0.25); margin-bottom: 14px; }
  .lp-plan-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
  .lp-plan-amt { font-family: ${fonts.display}; font-size: 40px; font-weight: 700; letter-spacing: -0.03em; color: ${colors.text}; font-feature-settings: "tnum" 1; }
  .lp-plan-amt-sm { font-size: 28px; }
  .lp-plan-amt-green { color: ${colors.positive}; }
  .lp-plan-strike { font-size: 18px; color: ${colors.textMuted}; text-decoration: line-through; }
  .lp-plan-per { font-size: 13px; color: ${colors.textMuted}; }
  .lp-plan-save { font-family: ${fonts.mono}; font-size: 11px; color: ${colors.positive}; background: ${colors.positiveSoft}; display: inline-block; align-self: flex-start; padding: 4px 10px; border-radius: ${radius.pill}; margin-bottom: 12px; }
  .lp-plan-tagline { font-size: 14px; color: ${colors.textSecondary}; line-height: 1.6; margin: 10px 0 18px; }
  .lp-plan-features { list-style: none; padding: 0; margin: 0 0 18px; display: flex; flex-direction: column; gap: 10px; }
  .lp-plan-features li { display: flex; gap: 10px; font-size: 14px; color: ${colors.textSecondary}; line-height: 1.5; }
  .lp-plan-tick { color: ${colors.accentHover}; flex-shrink: 0; }
  .lp-plan-more { font-size: 12px; color: ${colors.textMuted}; margin-bottom: 18px; }
  .lp-plan-cta { margin-top: auto; width: 100%; }
  .lp-plans-compare { font-size: 14px; font-weight: 600; color: ${colors.accentHover}; text-decoration: none; }
  .lp-plans-compare:hover { text-decoration: underline; }
  @media (max-width: 720px) { .lp-plans { grid-template-columns: 1fr; } }

  .lp-faq-section { max-width: 820px; }
  .lp-faq { display: flex; flex-direction: column; gap: 12px; }
  .lp-faq-item { border-radius: ${radius.md}; ${glassCss} overflow: hidden; }
  .lp-faq-item.open { border-color: rgba(16,185,129,0.35); }
  .lp-faq-h { margin: 0; font-size: inherit; font-weight: inherit; }
  .lp-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; background: transparent; border: none; cursor: pointer; text-align: left; color: ${colors.text}; font-family: ${fonts.sans}; font-size: 16px; font-weight: 600; }
  .lp-faq-chev { color: ${colors.accentHover}; font-size: 22px; line-height: 1; }
  .lp-faq-a { padding: 0 24px 22px; color: ${colors.textSecondary}; font-size: 15px; line-height: 1.65; }
  .lp-faq-a[hidden] { display: none; }

  .lp-footcta { position: relative; text-align: center; padding: 110px 24px; overflow: hidden; border-top: 1px solid ${colors.borderSubtle}; }

  @media (max-width: 860px) {
    .lp-flow { grid-template-columns: 1fr 1fr; }
    .lp-flow-line { display: none; }
    .lp-section { padding: 56px 22px; }
    .lp-hero { padding: 70px 20px 60px; }
  }
  @media (max-width: 520px) {
    .lp-flow { grid-template-columns: 1fr; }
    .lp-cta { flex-direction: column; align-items: center; }
    .lp-features { grid-template-columns: 1fr; }
    .lp-plan { padding: 26px 22px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-orb, .lp-eyebrow-dot { animation: none; }
    .lp-panel, .lp-flow-card, .lp-feature, .lp-btn { transition: none; }
  }
`;
