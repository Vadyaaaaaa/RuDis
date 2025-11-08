const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { getUserServers, createServer, getServerById } = require('../database/db');
const { createChannel } = require('../database/db');

const router = express.Router();

// Get user's servers
router.get('/', authenticateToken, (req, res) => {
  try {
    const servers = getUserServers(req.user.id);
    res.json(servers);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get server by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const server = getServerById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    res.json(server);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create server
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    const server = {
      id: uuidv4(),
      name,
      ownerId: req.user.id,
      members: [{
        id: req.user.id,
        username: req.user.username,
        role: 'owner'
      }],
      createdAt: new Date().toISOString()
    };

    const createdServer = createServer(server);

    // Create default "general" channel
    const generalChannel = {
      id: uuidv4(),
      name: 'general',
      serverId: createdServer.id,
      type: 'text',
      createdAt: new Date().toISOString()
    };
    createChannel(generalChannel);

    res.status(201).json(createdServer);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

