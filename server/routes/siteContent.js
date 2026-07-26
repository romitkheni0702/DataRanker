// routes/siteContent.js
// GET /site-content  — public; returns the editable copy for all public pages.
// PUT /admin/site-content — requireAdmin; replaces landing/demo/about blocks.

const express = require("express");
const SiteContent = require("../models/SiteContent");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/site-content", async (_req, res) => {
  try {
    const doc = await SiteContent.getOrCreate();
    res.json({ landing: doc.landing || {}, demo: doc.demo || {}, about: doc.about || {} });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

router.put("/admin/site-content", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { landing, demo, about } = req.body;
    const doc = await SiteContent.getOrCreate();
    if (landing !== undefined) { doc.landing = landing; doc.markModified("landing"); }
    if (demo    !== undefined) { doc.demo    = demo;    doc.markModified("demo");    }
    if (about   !== undefined) { doc.about   = about;   doc.markModified("about");   }
    await doc.save();
    res.json({ landing: doc.landing, demo: doc.demo, about: doc.about });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
