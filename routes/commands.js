const express = require('express');
const { body, param, validationResult } = require('express-validator');
const CommandLog = require('../models/CommandLog');

const router = express.Router();

// POST /api/commands/:device_id - Trigger a mock robot command
router.post('/:device_id', [
  param('device_id').isUUID().withMessage('Invalid device ID'),
  body('command_name').notEmpty().withMessage('Command name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id } = req.params;
    const { command_name } = req.body;

    // Mock command execution (simulate success/failure)
    const status = Math.random() > 0.2 ? 'success' : 'failed';

    const commandLog = new CommandLog({
      device_id,
      command_name,
      status
    });

    await commandLog.save();
    
    // Simulate command execution delay
    setTimeout(async () => {
      if (status === 'pending') {
        commandLog.status = Math.random() > 0.3 ? 'success' : 'failed';
        await commandLog.save();
      }
    }, 2000);

    res.status(201).json(commandLog);
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commands/:device_id - Return last 5 commands
router.get('/:device_id', [
  param('device_id').isUUID().withMessage('Invalid device ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id } = req.params;
    
    const commands = await CommandLog.find({ device_id })
      .sort({ issued_at: -1 })
      .limit(5);

    res.json(commands);
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;