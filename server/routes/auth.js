import express from 'express';

const router = express.Router();

// Получение информации о текущем пользователе (гость или авторизованный)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Токен отсутствует' });
    }

    // Если это гостевой токен
    if (token.startsWith('guest-token-')) {
      const guestId = token.replace('guest-token-', '');
      return res.json({
        user: {
          id: `guest-${guestId}`,
          username: 'Гость',
          email: 'guest@ruscord.com',
        },
      });
    }

    // Для обычных пользователей (если будут в будущем)
    res.json({
      user: {
        id: 'guest',
        username: 'Гость',
        email: 'guest@ruscord.com',
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Ошибка получения пользователя' });
  }
});

export default router;

