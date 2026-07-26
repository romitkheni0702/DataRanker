const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema({
  landing: { type: mongoose.Schema.Types.Mixed, default: {} },
  demo:    { type: mongoose.Schema.Types.Mixed, default: {} },
  about:   { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

siteContentSchema.statics.getOrCreate = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model("SiteContent", siteContentSchema);
