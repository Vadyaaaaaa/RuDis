const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { getChannelsByServer, createChannel, getChannelById } = require('../database/db');

const router = express.Router();

// Get channels by server
router.get('/server/:serverId', authenticateToken, (req, res) => {
  try {
    const channels = getChannelsByServer(req.params.serverId);
    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get channel by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const channel = getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create channel
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, serverId, type = 'text' } = req.body;

    if (!name || !serverId) {
      return res.status(400).json({ error: 'Channel name and server ID are required' });
    }

    const channel = {
      id: uuidv4(),
      name,
      serverId,
      type,
      createdAt: new Date().toISOString()
    };

    const createdChannel = createChannel(channel);
    res.status(201).json(createdChannel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

