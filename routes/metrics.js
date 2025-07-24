const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const TelemetryMetric = require('../models/TelemetryMetric');
const TelemetryData = require('../models/TelemetryData');

const router = express.Router();

// POST /api/metrics/types - Add a telemetry metric
router.post('/types', [
  body('metric_name').notEmpty().withMessage('Metric name is required'),
  body('metric_unit').notEmpty().withMessage('Metric unit is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { metric_name, metric_unit } = req.body;
    
    const telemetryMetric = new TelemetryMetric({
      metric_id: uuidv4(),
      metric_name,
      metric_unit
    });

    await telemetryMetric.save();
    res.status(201).json(telemetryMetric);
  } catch (error) {
    console.error('Error creating metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/metrics/types - Get all metric types
router.get('/types', async (req, res) => {
  try {
    const metrics = await TelemetryMetric.find();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/metrics/:device_id/data - Push telemetry data
router.post('/:device_id/data', [
  param('device_id').isUUID().withMessage('Invalid device ID'),
  body('metric_id').isUUID().withMessage('Invalid metric ID'),
  body('value').notEmpty().withMessage('Value is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id } = req.params;
    const { metric_id, value } = req.body;

    // Additional validation based on metric type
    const metric = await TelemetryMetric.findOne({ metric_id });
    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    if (metric.metric_name === 'battery') {
      const batteryValue = parseFloat(value);
      if (batteryValue < 0 || batteryValue > 100) {
        return res.status(400).json({ error: 'Battery value must be between 0 and 100' });
      }
    }

    if (metric.metric_name === 'temperature') {
      const tempValue = parseFloat(value);
      if (tempValue < 0 || tempValue > 80) {
        return res.status(400).json({ error: 'Temperature value must be between 0 and 80°C' });
      }
    }

    const telemetryData = new TelemetryData({
      device_id,
      metric_id,
      value
    });

    await telemetryData.save();
    res.status(201).json(telemetryData);
  } catch (error) {
    console.error('Error saving telemetry data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/metrics/:device_id/data - Get last N telemetry records
router.get('/:device_id/data', [
  param('device_id').isUUID().withMessage('Invalid device ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const telemetryData = await TelemetryData.find({ device_id })
      .sort({ recorded_at: -1 })
      .limit(limit);

    // Join with metric data
    const metrics = await TelemetryMetric.find();
    const metricsMap = metrics.reduce((acc, metric) => {
      acc[metric.metric_id] = metric;
      return acc;
    }, {});

    const enrichedData = telemetryData.map(data => ({
      ...data.toObject(),
      metric_name: metricsMap[data.metric_id]?.metric_name,
      metric_unit: metricsMap[data.metric_id]?.metric_unit
    }));

    res.json(enrichedData);
  } catch (error) {
    console.error('Error fetching telemetry data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/metrics/:device_id/summary - Return summary statistics
router.get('/:device_id/summary', [
  param('device_id').isUUID().withMessage('Invalid device ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id } = req.params;
    
    const telemetryData = await TelemetryData.find({ device_id });
    const metrics = await TelemetryMetric.find();
    
    const summary = {};
    
    for (const metric of metrics) {
      const metricData = telemetryData.filter(d => d.metric_id === metric.metric_id);
      
      if (metricData.length === 0) {
        summary[metric.metric_name] = {
          metric_unit: metric.metric_unit,
          count: 0,
          latest: null,
          average: null,
          min: null,
          max: null
        };
        continue;
      }

      const values = metricData
        .map(d => d.value)
        .filter(v => !isNaN(parseFloat(v)))
        .map(v => parseFloat(v));

      const latest = metricData.sort((a, b) => b.recorded_at - a.recorded_at)[0];

      summary[metric.metric_name] = {
        metric_unit: metric.metric_unit,
        count: metricData.length,
        latest: latest.value,
        latest_timestamp: latest.recorded_at,
        average: values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : null,
        min: values.length > 0 ? Math.min(...values) : null,
        max: values.length > 0 ? Math.max(...values) : null
      };
    }

    res.json(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;