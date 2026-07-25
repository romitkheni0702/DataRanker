// scripts/seedPlans.js
// Usage: run from server/ directory → node scripts/seedPlans.js
// Upserts Standard and Premium plans into MongoDB. Safe to re-run.

require("dotenv").config();
const mongoose = require("mongoose");
const Plan     = require("../models/Plan");

const PLANS = [
  {
    planId:            "standard",
    name:              "Standard",
    tagline:           "Everything you need to rank, analyse and compare stocks. Free for 3 months.",
    order:             1,
    isActive:          true,
    highlighted:       true,
    cta:               "Start free trial",
    monthlyPrice:      499,
    yearlyPrice:       4999,
    yearlyDiscountPct: 17,
    trialDays:         90,
    features: [
      "Rank any stock universe in minutes. Upload a Screener.in CSV and get a scored, sorted Excel instantly",
      "Composite scoring across profitability, valuation, growth and efficiency",
      "Filter stocks with simple formulas before you rank, e.g. PE < 20 AND ROE > 15",
      "Compare 2 to 6 companies with radar charts, bar charts and percentile rankings",
      "Company deep-dive with live price, margins, ROE, EV/EBITDA, ownership and a 1-year chart",
      "Customise KPI weights to match your investment style",
      "Email yourself a PDF summary of the top-ranked companies in one click",
      "Daily pre-loaded screener snapshot, no upload needed",
      "Results saved automatically, come back without re-uploading",
    ],
  },
  {
    planId:            "premium",
    name:              "Premium",
    tagline:           "Advanced analytics, real-time alerts, watchlists and AI interpretation on top of everything in Standard.",
    order:             2,
    isActive:          true,
    highlighted:       false,
    cta:               "Contact us to upgrade",
    monthlyPrice:      0,
    yearlyPrice:       0,
    yearlyDiscountPct: 0,
    trialDays:         0,
    features: [
      "Everything in Standard",
      "Detailed fundamental scores, margin breakdowns and ratio analysis",
      "Sector benchmarking, leaderboard scoring and radar charts",
      "Real-time alerts on earnings, downgrades and macro signals",
      "Custom stock watchlist to track price, KPIs and movement across your universe",
      "Daily BSE and NSE feed of results, board meetings and disclosures",
      "Multi-year OHLCV and fundamental time-series to back-test theses",
      "AI interpretation engine for plain-language insights on your own ranked data",
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const plan of PLANS) {
    const result = await Plan.findOneAndUpdate(
      { planId: plan.planId },
      { $set: plan },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✓ ${result.name} plan seeded (id: ${result.planId})`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
