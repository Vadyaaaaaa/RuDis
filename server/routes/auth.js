const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { 
  getUserByEmail, 
  getUserByUsername, 
  createUser,
  createVerificationCode,
  getVerificationCode,
  getVerificationCodeByEmail,
  deleteVerificationCode,
  updateUserVerificationStatus
} = db;
const { generateToken } = require('../middleware/auth');
const { sendVerificationCode } = require('../services/emailService');

const router = express.Router();

// Генерация 6-значного кода
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register - простая регистрация без подтверждения email
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    if (getUserByUsername(username)) {
      return res.status(400).json({ error: 'Имя пользователя уже занято' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = {
      id: uuidv4(),
      username,
      email: null, // Email не требуется
      password: hashedPassword,
      avatar: null,
      verified: true, // Автоматически подтвержден
      createdAt: new Date().toISOString()
    };

    createUser(user);

    // Генерируем токен
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
});

// Verify - подтверждение регистрации по коду
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email и код обязательны' });
    }

    // Проверяем код
    const verificationData = getVerificationCode(email, code);
    
    if (!verificationData) {
      return res.status(400).json({ error: 'Неверный или истекший код подтверждения' });
    }

    // Создаем пользователя
    const hashedPassword = await bcrypt.hash(verificationData.password, 10);

    const user = {
      id: uuidv4(),
      username: verificationData.username,
      email: verificationData.email,
      password: hashedPassword,
      avatar: null,
      verified: true,
      createdAt: new Date().toISOString()
    };

    createUser(user);

    // Удаляем использованный код
    deleteVerificationCode(email);

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Resend code - повторная отправка кода
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    // Проверяем, есть ли незавершенная регистрация
    const existingCode = getVerificationCodeByEmail(email);
    if (!existingCode) {
      return res.status(400).json({ error: 'Регистрация не найдена. Начните регистрацию заново.' });
    }

    // Генерируем новый код
    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    existingCode.code = code;
    existingCode.expiresAt = expiresAt.toISOString();
    createVerificationCode(existingCode);

    // Отправляем код
    const emailResult = await sendVerificationCode(email, code);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Ошибка отправки email' });
    }

    res.status(200).json({
      success: true,
      message: 'Новый код подтверждения отправлен на ваш email'
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Login - только по нику, без пароля
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Имя пользователя обязательно' });
    }

    // Ищем пользователя по username
    const user = getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

