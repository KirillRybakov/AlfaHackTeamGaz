# Dockerfile

# 1. Базовый образ
FROM python:3.10-slim

# 2. Установка рабочей директории
WORKDIR /app

# 3. Установка системных зависимостей, если они нужны
# RUN apt-get update && apt-get install -y ...

# 4. Установка переменных окружения
# Позволяет Python выводить логи сразу, без буферизации
ENV PYTHONUNBUFFERED 1

# 5. Копирование файлов зависимостей и их установка
COPY requirements.txt .
RUN pip install \
    --progress-bar off \
    --verbose \
    --default-timeout=100 \
    --no-cache-dir \
    -r requirements.txt

# 6. Копирование кода приложения
COPY ./app /app/app
COPY .env .

# 7. Указание порта и команды для запуска
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]