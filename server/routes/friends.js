const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const {
  getUserByUsername,
  getUserById,
  getFriendship,
  createFriendship,
  getFriendsList,
  getPendingRequests,
  updateFriendshipStatus,
  deleteFriendship,
  getUsers
} = require('../database/db');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить список друзей
router.get('/', (req, res) => {
  try {
    const friends = getFriendsList(req.user.id);
    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Ошибка получения списка друзей' });
  }
});

// Получить входящие запросы в друзья
router.get('/requests', (req, res) => {
  try {
    const requests = getPendingRequests(req.user.id);
    res.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Ошибка получения запросов' });
  }
});

// Отправить запрос в друзья
router.post('/request', (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Имя пользователя обязательно' });
    }

    if (username === req.user.username) {
      return res.status(400).json({ error: 'Нельзя добавить себя в друзья' });
    }

    const friend = getUserByUsername(username);
    if (!friend) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, есть ли уже дружба или запрос
    const existingFriendship = getFriendship(req.user.id, friend.id);
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ error: 'Вы уже друзья' });
      }
      if (existingFriendship.status === 'pending') {
        return res.status(400).json({ error: 'Запрос уже отправлен' });
      }
    }

    // Создаем новый запрос
    const friendship = {
      id: uuidv4(),
      userId: req.user.id,
      friendId: friend.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    createFriendship(friendship);

    res.status(201).json({
      success: true,
      message: 'Запрос в друзья отправлен',
      friendship
    });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Ошибка отправки запроса' });
  }
});

// Принять запрос в друзья
router.post('/accept/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = getPendingRequests(req.user.id);
    const request = requests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    const friendship = getFriendship(request.userId, req.user.id);
    if (!friendship) {
      return res.status(404).json({ error: 'Дружба не найдена' });
    }

    updateFriendshipStatus(request.userId, req.user.id, 'accepted');

    res.json({
      success: true,
      message: 'Запрос принят',
      friendship
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Ошибка принятия запроса' });
  }
});

// Отклонить запрос в друзья
router.post('/reject/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = getPendingRequests(req.user.id);
    const request = requests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    deleteFriendship(request.userId, req.user.id);

    res.json({
      success: true,
      message: 'Запрос отклонен'
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Ошибка отклонения запроса' });
  }
});

// Удалить из друзей
router.delete('/:friendId', (req, res) => {
  try {
    const { friendId } = req.params;
    const friend = getUserById(friendId);

    if (!friend) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const friendship = getFriendship(req.user.id, friendId);
    if (!friendship || friendship.status !== 'accepted') {
      return res.status(400).json({ error: 'Пользователь не в списке друзей' });
    }

    deleteFriendship(req.user.id, friendId);

    res.json({
      success: true,
      message: 'Пользователь удален из друзей'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Ошибка удаления из друзей' });
  }
});

// Поиск пользователей
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    const allUsers = getUsers();
    const currentUser = getUserById(req.user.id);
    const friends = getFriendsList(req.user.id);
    const friendIds = friends.map(f => f.id);

    // Исключаем текущего пользователя и друзей
    const filteredUsers = allUsers
      .filter(user => 
        user.id !== currentUser.id &&
        !friendIds.includes(user.id) &&
        user.username.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 10) // Ограничиваем 10 результатами
      .map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }));

    res.json({ users: filteredUsers });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Ошибка поиска пользователей' });
  }
});

module.exports = router;

