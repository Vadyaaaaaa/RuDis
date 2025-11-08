import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Получить каналы сервера
router.get('/server/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;

    // Проверка участия в сервере
    const member = await db.get(
      'SELECT * FROM server_members WHERE server_id = ? AND user_id = ?',
      [serverId, req.user.id]
    );

    if (!member) {
      return res.status(403).json({ error: 'Нет доступа к серверу' });
    }

    const channels = await db.all('SELECT * FROM channels WHERE server_id = ?', [serverId]);
    res.json({ channels });
  } catch (error) {
    console.error('Ошибка получения каналов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать канал
router.post('/', async (req, res) => {
  try {
    const { serverId, name, type } = req.body;

    if (!serverId || !name) {
      return res.status(400).json({ error: 'ID сервера и название обязательны' });
    }

    // Проверка участия в сервере
    const member = await db.get(
      'SELECT * FROM server_members WHERE server_id = ? AND user_id = ?',
      [serverId, req.user.id]
    );

    if (!member) {
      return res.status(403).json({ error: 'Нет доступа к серверу' });
    }

    const channelId = uuidv4();
    await db.run(
      'INSERT INTO channels (id, server_id, name, type) VALUES (?, ?, ?, ?)',
      [channelId, serverId, name, type || 'text']
    );

    const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    res.status(201).json({ channel });
  } catch (error) {
    console.error('Ошибка создания канала:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

