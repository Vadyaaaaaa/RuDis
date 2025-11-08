import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Получить сообщения канала
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    // Проверка доступа к каналу
    const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    if (!channel) {
      return res.status(404).json({ error: 'Канал не найден' });
    }

    const member = await db.get(
      `SELECT * FROM server_members sm
       WHERE sm.server_id = ? AND sm.user_id = ?`,
      [channel.server_id, req.user.id]
    );

    if (!member) {
      return res.status(403).json({ error: 'Нет доступа к каналу' });
    }

    let query = `
      SELECT m.*, u.username, u.avatar
      FROM messages m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ?
    `;
    const params = [channelId];

    if (before) {
      query += ' AND m.created_at < (SELECT created_at FROM messages WHERE id = ?)';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const messages = await db.all(query, params);
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отправить сообщение
router.post('/', async (req, res) => {
  try {
    const { channelId, content, attachment } = req.body;

    if (!channelId || !content) {
      return res.status(400).json({ error: 'ID канала и содержимое обязательны' });
    }

    // Проверка доступа к каналу
    const channel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    if (!channel) {
      return res.status(404).json({ error: 'Канал не найден' });
    }

    const member = await db.get(
      `SELECT * FROM server_members sm
       WHERE sm.server_id = ? AND sm.user_id = ?`,
      [channel.server_id, req.user.id]
    );

    if (!member) {
      return res.status(403).json({ error: 'Нет доступа к каналу' });
    }

    const messageId = uuidv4();
    await db.run(
      'INSERT INTO messages (id, channel_id, user_id, content, attachment) VALUES (?, ?, ?, ?, ?)',
      [messageId, channelId, req.user.id, content, attachment || null]
    );

    const message = await db.get(
      `SELECT m.*, u.username, u.avatar
       FROM messages m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [messageId]
    );

    res.status(201).json({ message });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

