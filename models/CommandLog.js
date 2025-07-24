const mongoose = require('mongoose');

const commandLogSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true
  },
  command_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'pending']
  },
  issued_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CommandLog', commandLogSchema);