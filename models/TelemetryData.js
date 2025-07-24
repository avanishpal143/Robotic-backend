const mongoose = require('mongoose');

const telemetryDataSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true
  },
  metric_id: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  recorded_at: {
    type: Date,
    default: Date.now
  }
});

telemetryDataSchema.index({ device_id: 1, recorded_at: -1 });

module.exports = mongoose.model('TelemetryData', telemetryDataSchema);