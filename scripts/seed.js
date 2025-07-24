const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const RobotDevice = require('../models/RobotDevice');
const TelemetryMetric = require('../models/TelemetryMetric');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/robot_telemetry', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    // Clear existing data
    await RobotDevice.deleteMany({});
    await TelemetryMetric.deleteMany({});

    // Create sample devices
    const devices = [
      {
        device_id: uuidv4(),
        device_name: 'ORo-Alpha-001',
        model: 'ORo-V1'
      },
      {
        device_id: uuidv4(),
        device_name: 'ORo-Beta-002',
        model: 'ORo-V2'
      },
      {
        device_id: uuidv4(),
        device_name: 'ORo-Gamma-003',
        model: 'ORo-V1'
      }
    ];

    await RobotDevice.insertMany(devices);
    console.log('Devices seeded successfully');

    // Create metric types
    const metrics = [
      {
        metric_id: uuidv4(),
        metric_name: 'battery',
        metric_unit: '%'
      },
      {
        metric_id: uuidv4(),
        metric_name: 'temperature',
        metric_unit: '°C'
      },
      {
        metric_id: uuidv4(),
        metric_name: 'task_count',
        metric_unit: 'count'
      },
      {
        metric_id: uuidv4(),
        metric_name: 'status',
        metric_unit: 'status'
      }
    ];

    await TelemetryMetric.insertMany(metrics);
    console.log('Metrics seeded successfully');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();