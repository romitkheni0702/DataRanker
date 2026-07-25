// core/plans.js - hardcoded fallback subscription tiers (used when DB has no plans).
// Shape matches models/Plan.js and what the Pricing page expects (monthly/yearly
// prices, trial, discount). Admin can override all of these via /app/admin/plans.

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Everything you need to rank, analyse and compare stocks. Free for 3 months.",
    monthlyPrice: 499,
    yearlyPrice: 4999,
    monthlyDiscountedPrice: 0,
    yearlyDiscountedPrice: 0,
    yearlyDiscountPct: 17,
    trialDays: 90,
    highlighted: true,
    cta: "Start free trial",
    order: 1,
    features: [
      "Rank any stock universe in minutes",
      "Composite scoring across profitability, valuation, growth and efficiency",
      "Filter stocks with simple formulas before you rank",
      "Compare 2 to 6 companies with radar, bar and percentile charts",
      "Company deep-dive with live price, fundamentals and a 1-year chart",
      "Customise KPI weights to match your investment style",
      "Email yourself a PDF summary of the top-ranked companies",
      "Daily pre-loaded screener snapshot, no upload needed",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Advanced analytics, real-time alerts, watchlists and AI interpretation on top of everything in Standard.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyDiscountedPrice: 0,
    yearlyDiscountedPrice: 0,
    yearlyDiscountPct: 0,
    trialDays: 0,
    highlighted: false,
    cta: "Contact us to upgrade",
    order: 2,
    features: [
      "Everything in Standard",
      "Detailed fundamental scores, margin breakdowns and ratio analysis",
      "Sector benchmarking and leaderboard scoring",
      "Real-time alerts on earnings, downgrades and macro signals",
      "Custom stock watchlist across your curated universe",
      "Daily BSE and NSE announcements feed",
      "Multi-year historical data and KPI time-series",
      "AI interpretation engine for plain-language insights on your ranked data",
    ],
  },
];

// Valid plan ids (kept for any callers that need the id list).
const PLAN_IDS = PLANS.map((p) => p.id);

module.exports = { PLANS, PLAN_IDS };
