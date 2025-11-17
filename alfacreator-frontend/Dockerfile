# --- STAGE 1: Сборка React-приложения ---
FROM node:18-alpine AS build

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем весь остальной код
COPY . .

# Устанавливаем VITE_API_BASE_URL в /api/v1, чтобы Nginx мог перехватывать запросы
ENV VITE_API_BASE_URL=/api/v1

# Собираем статические файлы
RUN npm run build

# --- STAGE 2: Раздача статики через Nginx ---
FROM nginx:1.25-alpine

# Копируем собранные файлы из предыдущего этапа
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем нашу конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80, на котором работает Nginx
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]
