// Хранилище кодов подтверждения в памяти
// В production лучше использовать Redis или базу данных

const codes = new Map(); // email -> { code, expiresAt, attempts }

const CODE_EXPIRY = 10 * 60 * 1000; // 10 минут
const MAX_ATTEMPTS = 5; // Максимум попыток ввода кода

export const generateCode = () => {
  // Генерируем 6-значный код
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveCode = (email, code) => {
  const expiresAt = Date.now() + CODE_EXPIRY;
  codes.set(email, {
    code,
    expiresAt,
    attempts: 0,
  });

  // Автоматическая очистка после истечения
  setTimeout(() => {
    codes.delete(email);
  }, CODE_EXPIRY);
};

export const verifyCode = (email, inputCode) => {
  const stored = codes.get(email);

  if (!stored) {
    return { valid: false, error: 'Код не найден или истек' };
  }

  if (Date.now() > stored.expiresAt) {
    codes.delete(email);
    return { valid: false, error: 'Код истек' };
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    codes.delete(email);
    return { valid: false, error: 'Превышено количество попыток' };
  }

  stored.attempts++;

  if (stored.code !== inputCode) {
    return { valid: false, error: 'Неверный код' };
  }

  // Код верный, удаляем его
  codes.delete(email);
  return { valid: true };
};

export const deleteCode = (email) => {
  codes.delete(email);
};

