const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const RobotDevice = require('../models/RobotDevice');

const router = express.Router();

// POST /api/devices - Add a new robot device
router.post('/', [
  body('device_name').notEmpty().withMessage('Device name is required'),
  body('model').notEmpty().withMessage('Model is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_name, model } = req.body;
    
    const robotDevice = new RobotDevice({
      device_id: uuidv4(),
      device_name,
      model
    });

    await robotDevice.save();
    res.status(201).json(robotDevice);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/devices - List all devices
router.get('/', async (req, res) => {
  try {
    const devices = await RobotDevice.find().sort({ created_at: -1 });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;