const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { getMessagesByChannel, createMessage, getChannelById } = require('../database/db');

const router = express.Router();

// Get messages by channel
router.get('/channel/:channelId', authenticateToken, (req, res) => {
  try {
    const messages = getMessagesByChannel(req.params.channelId);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create message
router.post('/', authenticateToken, (req, res) => {
  try {
    const { content, channelId } = req.body;

    if (!content || !channelId) {
      return res.status(400).json({ error: 'Message content and channel ID are required' });
    }

    const channel = getChannelById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const message = {
      id: uuidv4(),
      content,
      channelId,
      userId: req.user.id,
      username: req.user.username,
      createdAt: new Date().toISOString()
    };

    const createdMessage = createMessage(message);
    res.status(201).json(createdMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

