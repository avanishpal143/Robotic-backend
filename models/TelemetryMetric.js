const mongoose = require('mongoose');

const telemetryMetricSchema = new mongoose.Schema({
  metric_id: {
    type: String,
    required: true,
    unique: true
  },
  metric_name: {
    type: String,
    required: true
  },
  metric_unit: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('TelemetryMetric', telemetryMetricSchema);