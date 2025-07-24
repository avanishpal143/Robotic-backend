const mongoose = require('mongoose');

const robotDeviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true
  },
  device_name: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RobotDevice', robotDeviceSchema);