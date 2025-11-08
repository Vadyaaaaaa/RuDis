# Dockerfile для Ruscord Backend
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем остальные файлы
COPY . .

# Открываем порт
EXPOSE 3001

# Запускаем приложение
CMD ["node", "index.js"]

