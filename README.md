# Ruscord

Клон Discord - современное приложение для обмена сообщениями в реальном времени.

## Описание

Ruscord - это полнофункциональное приложение для обмена сообщениями, созданное с использованием современных веб-технологий. Приложение поддерживает:

- ✅ Регистрацию и авторизацию пользователей
- ✅ Создание и управление серверами
- ✅ Текстовые и голосовые каналы
- ✅ Обмен сообщениями в реальном времени
- ✅ Современный UI в стиле Discord

## Технологии

### Backend
- **Node.js** + **Express** - серверная часть
- **Socket.io** - real-time коммуникация
- **SQLite** - база данных
- **JWT** - аутентификация
- **bcryptjs** - хеширование паролей

### Frontend
- **React** + **TypeScript** - пользовательский интерфейс
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - стилизация
- **Zustand** - управление состоянием
- **Socket.io Client** - клиент для real-time
- **Axios** - HTTP клиент

## Установка

### Предварительные требования
- Node.js (версия 18 или выше)
- npm или yarn

### Шаги установки

1. Клонируйте репозиторий (или используйте текущую директорию)

2. Установите зависимости для всех частей проекта:
```bash
npm run install-all
```

Или установите вручную:
```bash
# Корневая директория
npm install

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. Настройте переменные окружения (опционально):
```bash
cd server
cp .env.example .env
# Отредактируйте .env файл при необходимости
```

## Запуск

### Режим разработки

Запустите одновременно frontend и backend:
```bash
npm run dev
```

Или запустите отдельно:

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

### Production сборка

1. Соберите frontend:
```bash
cd client
npm run build
```

2. Запустите backend:
```bash
cd server
npm start
```

## Использование

1. Откройте браузер и перейдите на `http://localhost:5173`
2. **Регистрация:**
   - Нажмите "Зарегистрироваться"
   - Заполните форму (имя пользователя, email, пароль)
   - Нажмите "Отправить код подтверждения"
   - Введите код, который придет на email (в режиме разработки код выводится в консоль сервера)
   - Завершите регистрацию
3. **Вход:** Войдите используя email и пароль
4. Создайте сервер, нажав на кнопку "+" в левой панели
5. Выберите сервер и канал для начала общения
6. Начните отправлять сообщения!

### Настройка отправки email

По умолчанию в режиме разработки коды подтверждения выводятся в консоль сервера. Для реальной отправки email на почту:

#### Вариант 1: Gmail (Рекомендуется для начала)

1. Откройте файл `server/.env`
2. Настройте параметры SMTP:

   **Шаг 1:** Включите двухфакторную аутентификацию в Google аккаунте
   - Перейдите: https://myaccount.google.com/security
   - Включите "Двухэтапную аутентификацию"

   **Шаг 2:** Создайте пароль приложения
   - Перейдите: https://myaccount.google.com/apppasswords
   - Выберите "Почта" и "Другое устройство"
   - Введите название: "Ruscord"
   - Скопируйте сгенерированный 16-символьный пароль

   **Шаг 3:** Обновите `server/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=ваш-email@gmail.com
   SMTP_PASS=ваш-16-символьный-пароль-приложения
   SMTP_FROM=noreply@ruscord.com
   ```

3. Перезапустите backend сервер

#### Вариант 2: Mailtrap (Для тестирования)

1. Зарегистрируйтесь на https://mailtrap.io (бесплатно)
2. Создайте inbox и получите учетные данные
3. Обновите `server/.env`:
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=ваш-mailtrap-user
   SMTP_PASS=ваш-mailtrap-password
   SMTP_FROM=noreply@ruscord.com
   ```

#### Вариант 3: Другие SMTP сервисы

- **SendGrid** (бесплатный план: 100 писем/день)
- **Mailgun** (бесплатный план: 5000 писем/месяц)
- **AWS SES** (требует настройки AWS аккаунта)

Настройте соответствующие параметры в `server/.env`

## Структура проекта

```
Ruscord/
├── server/                 # Backend приложение
│   ├── routes/            # API маршруты
│   ├── middleware/        # Middleware (аутентификация)
│   ├── database.js        # Настройка базы данных
│   └── index.js           # Точка входа сервера
├── client/                # Frontend приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── api/          # API клиенты
│   │   ├── store/        # Zustand stores
│   │   └── App.tsx       # Главный компонент
│   └── ...
└── package.json           # Корневой package.json
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя

### Серверы
- `GET /api/servers` - Получить все серверы пользователя
- `POST /api/servers` - Создать сервер
- `GET /api/servers/:serverId` - Получить сервер по ID
- `POST /api/servers/:serverId/join` - Присоединиться к серверу

### Каналы
- `GET /api/channels/server/:serverId` - Получить каналы сервера
- `POST /api/channels` - Создать канал

### Сообщения
- `GET /api/messages/channel/:channelId` - Получить сообщения канала
- `POST /api/messages` - Отправить сообщение

## Socket.io Events

### Клиент → Сервер
- `join_channel` - Присоединиться к каналу
- `leave_channel` - Покинуть канал
- `send_message` - Отправить сообщение
- `typing_start` - Начало печати
- `typing_stop` - Остановка печати

### Сервер → Клиент
- `new_message` - Новое сообщение
- `user_typing` - Пользователь печатает
- `user_stopped_typing` - Пользователь перестал печатать
- `joined_channel` - Успешно присоединились к каналу
- `error` - Ошибка

## Разработка

### Добавление новых функций

1. **Новый API endpoint:**
   - Создайте роут в `server/routes/`
   - Подключите в `server/index.js`

2. **Новый компонент:**
   - Создайте в `client/src/components/`
   - Импортируйте и используйте в нужном месте

3. **Новое состояние:**
   - Создайте store в `client/src/store/`
   - Используйте через хуки Zustand

## Лицензия

MIT

## Автор

Проект Ruscord
