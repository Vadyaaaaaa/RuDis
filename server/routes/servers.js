import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить все серверы пользователя
router.get('/', async (req, res) => {
  try {
    const servers = await db.all(
      `SELECT s.* FROM servers s
       INNER JOIN server_members sm ON s.id = sm.server_id
       WHERE sm.user_id = ?`,
      [req.user.id]
    );

    res.json({ servers });
  } catch (error) {
    console.error('Ошибка получения серверов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать сервер
router.post('/', async (req, res) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название сервера обязательно' });
    }

    const serverId = uuidv4();
    const memberId = uuidv4();

    // Создание сервера
    await db.run(
      'INSERT INTO servers (id, name, icon, owner_id) VALUES (?, ?, ?, ?)',
      [serverId, name, icon || null, req.user.id]
    );

    // Добавление владельца как участника
    await db.run(
      'INSERT INTO server_members (id, server_id, user_id, role) VALUES (?, ?, ?, ?)',
      [memberId, serverId, req.user.id, 'owner']
    );

    // Создание канала по умолчанию
    const channelId = uuidv4();
    await db.run(
      'INSERT INTO channels (id, server_id, name, type) VALUES (?, ?, ?, ?)',
      [channelId, serverId, 'general', 'text']
    );

    const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);

    res.status(201).json({ server });
  } catch (error) {
    console.error('Ошибка создания сервера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить сервер по ID
router.get('/:serverId', async (req, res) => {
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

    const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
    const channels = await db.all('SELECT * FROM channels WHERE server_id = ?', [serverId]);
    const members = await db.all(
      `SELECT u.id, u.username, u.avatar, sm.role 
       FROM server_members sm
       INNER JOIN users u ON sm.user_id = u.id
       WHERE sm.server_id = ?`,
      [serverId]
    );

    res.json({ server, channels, members });
  } catch (error) {
    console.error('Ошибка получения сервера:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Присоединиться к серверу
router.post('/:serverId/join', async (req, res) => {
  try {
    const { serverId } = req.params;

    // Проверка существования сервера
    const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
    if (!server) {
      return res.status(404).json({ error: 'Сервер не найден' });
    }

    // Проверка уже участника
    const existingMember = await db.get(
      'SELECT * FROM server_members WHERE server_id = ? AND user_id = ?',
      [serverId, req.user.id]
    );

    if (existingMember) {
      return res.status(400).json({ error: 'Уже участник сервера' });
    }

    const memberId = uuidv4();
    await db.run(
      'INSERT INTO server_members (id, server_id, user_id, role) VALUES (?, ?, ?, ?)',
      [memberId, serverId, req.user.id, 'member']
    );

    res.status(201).json({ message: 'Успешно присоединились к серверу' });
  } catch (error) {
    console.error('Ошибка присоединения к серверу:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

