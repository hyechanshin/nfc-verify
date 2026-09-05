const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  tagUid: { type: String, required: true },
  counter: Number,
  valid: Boolean,
  scannedAt: { type: Date, default: Date.now },
  ip: String
});

module.exports = mongoose.model('Scan', scanSchema);
