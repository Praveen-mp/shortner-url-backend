const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  urlId: { type: mongoose.Schema.Types.ObjectId, ref: 'Url' },
  clicks: [
    {
      timestamp: { type: Date, default: Date.now },
      userAgent: String,
      ip: String,
      osName: String,
      deviceName: String,
    },
  ],
});

module.exports = mongoose.model('Analytics', analyticsSchema);
