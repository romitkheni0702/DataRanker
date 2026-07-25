// routes/plans.js - public subscription tiers for the Pricing page.
// Serves from MongoDB if plans exist, falls back to hardcoded defaults.

const express = require("express");
const Plan = require("../models/Plan");
const { PLANS: DEFAULT_PLANS } = require("../core/plans");

const router = express.Router();

// Normalise a plan (DB doc or hardcoded fallback) into the exact shape the
// Pricing page consumes, so both sources render identically.
function shape(p) {
  return {
    id: p.planId || p.id,
    name: p.name,
    tagline: p.tagline || "",
    features: p.features || [],
    monthlyPrice: p.monthlyPrice || 0,
    yearlyPrice: p.yearlyPrice || 0,
    monthlyDiscountedPrice: p.monthlyDiscountedPrice || 0,
    yearlyDiscountedPrice: p.yearlyDiscountedPrice || 0,
    yearlyDiscountPct: p.yearlyDiscountPct || 0,
    trialDays: p.trialDays || 0,
    highlighted: !!p.highlighted,
    cta: p.cta || "Get started",
  };
}

router.get("/plans", async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    const source = plans.length > 0 ? plans : DEFAULT_PLANS;
    res.json(source.map(shape));
  } catch {
    res.json(DEFAULT_PLANS.map(shape));
  }
});

module.exports = router;
