import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";
import { getUser } from "../auth";
import { colors, fonts, radius } from "../theme";

// ─── code-level defaults (mirrors the hardcoded copy in each public page) ─────

const DEFAULTS = {
  landing: {
    heroEyebrow:     "Think · Research · Analyse · Invest",
    heroTitle:       "Rank every company.",
    heroTitleAccent: "With precision.",
    heroSubtitle:    "ThinkVest turns raw fundamentals into a defensible, weighted ranking, mapped to your sectors and scored against your KPI templates.",
    footerCta:       "Ready to see your rankings?",
    workflow: [
      { title: "Upload Screener Data",  desc: "Drop in your Screener.in CSV export. KPI library and sector mapping are managed server-side, so there is nothing else to configure." },
      { title: "Filter Your Universe",  desc: "Use the live screener to slice by any metric with a formula DSL, then run on exactly the companies you want." },
      { title: "Run Pipeline",          desc: "One click formats, sector-maps and scores your universe in a single pass against your KPI templates." },
      { title: "Download Rankings",     desc: "A colour-coded, multi-sheet ranked Excel report, ready to open, audit and share immediately." },
    ],
    features: [
      { title: "Smart column mapping",     desc: "Auto-matches your CSV headers to the canonical schema. No manual mapping required for standard Screener.in exports." },
      { title: "Direction-aware scoring",  desc: "Every KPI is ranked by its own higher/lower-is-better rule and weighted into one defensible, auditable score." },
      { title: "190 to 130 sector mapping",desc: "Industries are mapped to your SCS sectors and KPI templates automatically before ranking. No manual join required." },
      { title: "Live screener",            desc: "Filter your daily universe with a formula DSL (ROE > 15 AND Sector = Banks), compare companies, then pipeline the results." },
      { title: "Excel-native output",      desc: "A colour-coded, multi-sheet ranked report you can open, audit and share immediately. No post-processing needed." },
      { title: "Editable KPI library",     desc: "Tune templates, weights and directions in-app. Changes apply on the next pipeline run, with no spreadsheets to wrangle." },
    ],
  },
  demo: {
    heroEyebrow:     "Watch it work, no sign-up",
    heroTitle:       "From 400 stocks to",
    heroTitleAccent: "your top six.",
    heroSubtitle:    "Filter the market with a plain formula, score every company on the KPIs you trust, and download a ranked report. Here is the real workflow.",
    heroTrust:       "Free for 90 days. No credit card.",
    step1Title:      "Screen the whole market",
    step1Lead:       "Type a plain formula and the list narrows on the spot. Then run the ranker on exactly the companies that pass.",
    step2Title:      "Score them in one pass",
    step2Lead:       "Cleaning, sector mapping and KPI scoring run together on one click. Your weights, your rules. The scoring logic stays on our servers.",
    step3Title:      "Get a report you can defend",
    step3Lead:       "Every company gets a score out of 100, built from your weighted KPIs. Green is strong, red is weak, and every rank traces back to a number.",
    alsoTitle:       "And once you are in",
    footerCtaTitle:  "Rank your own universe today",
    footerCtaSub:    "Free for 90 days. No credit card, cancel anytime.",
  },
  about: {
    heroTitle:       "We turn fundamentals into",
    heroTitleAccent: "defensible rankings.",
    heroSubtitle:    "ThinkVest is a proprietary equity-ranking engine. It maps company fundamentals to your sectors and scores them against your KPI templates - so your team spends time on judgement, not spreadsheets.",
    valuesTitle:     "What we believe",
    ctaTitle:        "See it on your own data",
    stats: [
      { k: "3-stage",    v: "pipeline: format → map → rank" },
      { k: "190 → 130",  v: "industry-to-sector mapping" },
      { k: "1 click",    v: "from raw export to ranked report" },
    ],
    values: [
      { title: "Defensible by design", desc: "Every score traces back to a KPI, a weight and a direction you control. No black boxes." },
      { title: "Analyst-first",        desc: "Built around the real workflow of equity research - export, map, rank, export again." },
      { title: "Your methodology",     desc: "ThinkVest runs your templates. The edge stays yours; we just make it fast and repeatable." },
    ],
  },
};

function mergeWithDefaults(fetched) {
  const out = {};
  for (const page of ["landing", "demo", "about"]) {
    const saved = fetched?.[page] || {};
    const def   = DEFAULTS[page];
    out[page]   = { ...def };
    for (const key of Object.keys(def)) {
      if (Array.isArray(def[key])) {
        const savedArr = Array.isArray(saved[key]) ? saved[key] : [];
        out[page][key] = def[key].map((item, i) => ({ ...item, ...(savedArr[i] || {}) }));
      } else {
        out[page][key] = saved[key] !== undefined && saved[key] !== null ? saved[key] : def[key];
      }
    }
  }
  return out;
}

// ─── field components ─────────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline = false, hint }) {
  const base = {
    width: "100%", boxSizing: "border-box",
    background: colors.inset, border: `1px solid ${colors.border}`,
    borderRadius: radius.sm, color: colors.text,
    fontFamily: fonts.sans, fontSize: 13,
    padding: "9px 12px", outline: "none",
    transition: "border-color .15s",
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: colors.textMuted, marginBottom: 5 }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 5 }}>{hint}</div>}
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...base, resize: "vertical", lineHeight: 1.55 }}
          onFocus={e => (e.target.style.borderColor = colors.accent)}
          onBlur={e => (e.target.style.borderColor = colors.border)}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={base}
          onFocus={e => (e.target.style.borderColor = colors.accent)}
          onBlur={e => (e.target.style.borderColor = colors.border)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      margin: "32px 0 20px",
    }}>
      <div style={{
        fontFamily: fonts.mono, fontSize: 11, fontWeight: 700,
        letterSpacing: ".16em", textTransform: "uppercase",
        color: colors.accentHover,
        background: colors.accentSoft,
        border: `1px solid rgba(16,185,129,0.25)`,
        borderRadius: radius.pill, padding: "4px 12px",
      }}>
        {title}
      </div>
      <div style={{ flex: 1, height: 1, background: colors.borderSubtle }} />
    </div>
  );
}

function ArrayCard({ index, children }) {
  return (
    <div style={{
      background: colors.inset, border: `1px solid ${colors.borderSubtle}`,
      borderRadius: radius.md, padding: "16px 18px", marginBottom: 12,
    }}>
      <div style={{ fontSize: 11, fontFamily: fonts.mono, color: colors.textMuted, marginBottom: 12, letterSpacing: ".06em" }}>
        #{index + 1}
      </div>
      {children}
    </div>
  );
}

// ─── tab panels ──────────────────────────────────────────────────────────────

function ProductTab({ form, setForm }) {
  const get = k => form.landing?.[k] ?? "";
  const set = (k, v) => setForm(f => ({ ...f, landing: { ...f.landing, [k]: v } }));
  const setArr = (arrKey, i, field, val) => {
    const arr = [...(form.landing?.[arrKey] ?? [])];
    arr[i] = { ...arr[i], [field]: val };
    set(arrKey, arr);
  };

  return (
    <div>
      <SectionHeader title="Hero" />
      <Field label="Eyebrow text"    value={get("heroEyebrow")}     onChange={v => set("heroEyebrow", v)} />
      <Field label="Main title"      value={get("heroTitle")}       onChange={v => set("heroTitle", v)} />
      <Field label="Gradient line"   value={get("heroTitleAccent")} onChange={v => set("heroTitleAccent", v)} hint="Displayed in the brand gradient colour." />
      <Field label="Subtitle"        value={get("heroSubtitle")}    onChange={v => set("heroSubtitle", v)} multiline />

      <SectionHeader title="How it works — 4 steps" />
      {(form.landing?.workflow ?? DEFAULTS.landing.workflow).map((step, i) => (
        <ArrayCard key={i} index={i}>
          <Field label="Title"       value={step.title} onChange={v => setArr("workflow", i, "title", v)} />
          <Field label="Description" value={step.desc}  onChange={v => setArr("workflow", i, "desc",  v)} multiline />
        </ArrayCard>
      ))}

      <SectionHeader title="Capabilities — 6 features" />
      {(form.landing?.features ?? DEFAULTS.landing.features).map((feat, i) => (
        <ArrayCard key={i} index={i}>
          <Field label="Title"       value={feat.title} onChange={v => setArr("features", i, "title", v)} />
          <Field label="Description" value={feat.desc}  onChange={v => setArr("features", i, "desc",  v)} multiline />
        </ArrayCard>
      ))}

      <SectionHeader title="Footer" />
      <Field label="CTA heading" value={get("footerCta")} onChange={v => set("footerCta", v)} />
    </div>
  );
}

function DemoTab({ form, setForm }) {
  const get = k => form.demo?.[k] ?? "";
  const set = (k, v) => setForm(f => ({ ...f, demo: { ...f.demo, [k]: v } }));

  return (
    <div>
      <SectionHeader title="Hero" />
      <Field label="Eyebrow text"  value={get("heroEyebrow")}     onChange={v => set("heroEyebrow", v)} />
      <Field label="Main title"    value={get("heroTitle")}       onChange={v => set("heroTitle", v)} />
      <Field label="Gradient line" value={get("heroTitleAccent")} onChange={v => set("heroTitleAccent", v)} hint="Displayed in the brand gradient colour." />
      <Field label="Subtitle"      value={get("heroSubtitle")}    onChange={v => set("heroSubtitle", v)} multiline />
      <Field label="Trust line"    value={get("heroTrust")}       onChange={v => set("heroTrust", v)} hint='Small line below the CTA buttons, e.g. "Free for 90 days. No credit card."' />

      <SectionHeader title="Step 1 — Screener" />
      <Field label="Heading"        value={get("step1Title")} onChange={v => set("step1Title", v)} />
      <Field label="Lead paragraph" value={get("step1Lead")}  onChange={v => set("step1Lead",  v)} multiline />

      <SectionHeader title="Step 2 — Pipeline" />
      <Field label="Heading"        value={get("step2Title")} onChange={v => set("step2Title", v)} />
      <Field label="Lead paragraph" value={get("step2Lead")}  onChange={v => set("step2Lead",  v)} multiline />

      <SectionHeader title="Step 3 — Results" />
      <Field label="Heading"        value={get("step3Title")} onChange={v => set("step3Title", v)} />
      <Field label="Lead paragraph" value={get("step3Lead")}  onChange={v => set("step3Lead",  v)} multiline />

      <SectionHeader title="Closing" />
      <Field label='"Also included" heading' value={get("alsoTitle")}      onChange={v => set("alsoTitle",      v)} />
      <Field label="Footer CTA heading"      value={get("footerCtaTitle")} onChange={v => set("footerCtaTitle", v)} />
      <Field label="Footer CTA sub-text"     value={get("footerCtaSub")}   onChange={v => set("footerCtaSub",   v)} multiline />
    </div>
  );
}

function AboutTab({ form, setForm }) {
  const get = k => form.about?.[k] ?? "";
  const set = (k, v) => setForm(f => ({ ...f, about: { ...f.about, [k]: v } }));
  const setArr = (arrKey, i, field, val) => {
    const arr = [...(form.about?.[arrKey] ?? [])];
    arr[i] = { ...arr[i], [field]: val };
    set(arrKey, arr);
  };

  return (
    <div>
      <SectionHeader title="Hero" />
      <Field label="Title line 1"  value={get("heroTitle")}       onChange={v => set("heroTitle", v)} />
      <Field label="Gradient line" value={get("heroTitleAccent")} onChange={v => set("heroTitleAccent", v)} hint="Displayed in the brand gradient colour." />
      <Field label="Subtitle"      value={get("heroSubtitle")}    onChange={v => set("heroSubtitle", v)} multiline />

      <SectionHeader title="Stats — 3 tiles" />
      {(form.about?.stats ?? DEFAULTS.about.stats).map((s, i) => (
        <ArrayCard key={i} index={i}>
          <Field label="Key / headline" value={s.k} onChange={v => setArr("stats", i, "k", v)} />
          <Field label="Value / sub"    value={s.v} onChange={v => setArr("stats", i, "v", v)} />
        </ArrayCard>
      ))}

      <SectionHeader title="Values" />
      <Field label="Section heading" value={get("valuesTitle")} onChange={v => set("valuesTitle", v)} />
      {(form.about?.values ?? DEFAULTS.about.values).map((val, i) => (
        <ArrayCard key={i} index={i}>
          <Field label="Title"       value={val.title} onChange={v => setArr("values", i, "title", v)} />
          <Field label="Description" value={val.desc}  onChange={v => setArr("values", i, "desc",  v)} multiline />
        </ArrayCard>
      ))}

      <SectionHeader title="CTA" />
      <Field label="CTA heading" value={get("ctaTitle")} onChange={v => set("ctaTitle", v)} />
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

const TABS = ["Product", "Demo", "About"];

export default function AdminContentPage() {
  const user = getUser();
  if (!user?.isAdmin) return <Navigate to="/app" replace />;

  return <ContentEditor />;
}

function ContentEditor() {
  const [tab,     setTab]     = useState("Product");
  const [form,    setForm]    = useState(mergeWithDefaults({}));
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  useEffect(() => {
    fetch(apiUrl("/site-content"))
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setForm(mergeWithDefaults(d)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/admin/site-content", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setMsg("Saved");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg("Error: " + (err.message || "save failed"));
    } finally {
      setSaving(false);
    }
  }, [form]);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 820, margin: "0 auto", fontFamily: fonts.sans }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: colors.accentHover, marginBottom: 5 }}>
            Admin · Content Editor
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
            Page content
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: colors.textSecondary }}>
            Edit the copy for the public-facing Product, Demo, and About pages. Changes take effect immediately after saving.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {msg && (
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: msg.startsWith("Error") ? "#EF4444" : "#22C55E",
            }}>
              {msg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving || loading}
            style={{
              padding: "10px 24px", borderRadius: radius.sm,
              background: saving || loading ? colors.elevated : "linear-gradient(135deg,#10B981 0%,#1E3A8A 100%)",
              border: "none", color: "#fff", fontWeight: 600, fontSize: 13,
              fontFamily: fonts.sans, cursor: saving || loading ? "not-allowed" : "pointer",
              opacity: saving || loading ? 0.6 : 1, transition: "opacity .15s",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4, padding: "5px", marginBottom: 28,
        background: colors.inset, borderRadius: radius.md,
        border: `1px solid ${colors.borderSubtle}`,
        width: "fit-content",
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "9px 22px", border: "none", borderRadius: radius.sm,
              fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "linear-gradient(135deg,#10B981 0%,#1E3A8A 100%)" : "transparent",
              color: tab === t ? "#fff" : colors.textSecondary,
              transition: "all .15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: colors.textMuted, fontSize: 14 }}>Loading content…</div>
      ) : (
        <>
          {tab === "Product" && <ProductTab form={form} setForm={setForm} />}
          {tab === "Demo"    && <DemoTab    form={form} setForm={setForm} />}
          {tab === "About"   && <AboutTab   form={form} setForm={setForm} />}
        </>
      )}

      {/* Bottom save strip */}
      <div style={{
        marginTop: 40, paddingTop: 24, borderTop: `1px solid ${colors.borderSubtle}`,
        display: "flex", justifyContent: "flex-end", gap: 12,
      }}>
        {msg && (
          <span style={{
            fontSize: 13, fontWeight: 600, alignSelf: "center",
            color: msg.startsWith("Error") ? "#EF4444" : "#22C55E",
          }}>
            {msg}
          </span>
        )}
        <button
          onClick={save}
          disabled={saving || loading}
          style={{
            padding: "11px 28px", borderRadius: radius.sm,
            background: saving || loading ? colors.elevated : "linear-gradient(135deg,#10B981 0%,#1E3A8A 100%)",
            border: "none", color: "#fff", fontWeight: 600, fontSize: 14,
            fontFamily: fonts.sans, cursor: saving || loading ? "not-allowed" : "pointer",
            opacity: saving || loading ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
