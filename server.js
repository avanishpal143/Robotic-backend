const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://mravanishpal143:UAVIKUMAr12%40@robotic.lfeuxze.mongodb.net/?retryWrites=true&w=majority&appName=Robotic', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Import routes
const deviceRoutes = require('./routes/devices');
const metricRoutes = require('./routes/metrics');
const commandRoutes = require('./routes/commands');

// Use routes
app.use('/api/devices', deviceRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/commands', commandRoutes);

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe_device', (deviceId) => {
    socket.join(`device_${deviceId}`);
    console.log(`Client ${socket.id} subscribed to device ${deviceId}`);
  });

  socket.on('unsubscribe_device', (deviceId) => {
    socket.leave(`device_${deviceId}`);
    console.log(`Client ${socket.id} unsubscribed from device ${deviceId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Mock telemetry data generator
const TelemetryData = require('./models/TelemetryData');
const RobotDevice = require('./models/RobotDevice');
const TelemetryMetric = require('./models/TelemetryMetric');

const generateMockTelemetry = async () => {
  try {
    const devices = await RobotDevice.find();
    const metrics = await TelemetryMetric.find();

    for (const device of devices) {
      for (const metric of metrics) {
        let value;
        
        switch (metric.metric_name) {
          case 'battery':
            value = Math.floor(Math.random() * 100).toString();
            break;
          case 'temperature':
            value = (Math.random() * 80).toFixed(1);
            break;
          case 'task_count':
            value = Math.floor(Math.random() * 50).toString();
            break;
          case 'status':
            value = Math.random() > 0.8 ? 'error' : 'operational';
            break;
          default:
            value = Math.random().toFixed(2);
        }

        const telemetryData = new TelemetryData({
          device_id: device.device_id,
          metric_id: metric.metric_id,
          value: value,
          recorded_at: new Date()
        });

        await telemetryData.save();

        // Emit to subscribers
        io.to(`device_${device.device_id}`).emit('telemetry_update', {
          device_id: device.device_id,
          metric_name: metric.metric_name,
          metric_unit: metric.metric_unit,
          value: value,
          recorded_at: telemetryData.recorded_at
        });
      }
    }
  } catch (error) {
    console.error('Error generating mock telemetry:', error);
  }
};

// Generate mock data every 3 seconds
setInterval(generateMockTelemetry, 3000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };