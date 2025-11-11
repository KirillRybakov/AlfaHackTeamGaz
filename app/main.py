# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.routers import promo, analytics

app = FastAPI(
    title="Альфа-Креатор API",
    description="API для генерации контента и аналитики для малого бизнеса.",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Для хакатона безопасно, для продакшена стоит указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Настройка логирования
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("app.log", rotation="5 MB", level="DEBUG", encoding="utf-8")

@app.get("/", summary="Корневой эндпоинт", description="Проверка доступности сервиса.")
def read_root():
    return {"message": "Добро пожаловать в Альфа-Креатор API!"}

# Подключение роутеров
app.include_router(promo.router, prefix="/api/v1/promo", tags=["Промо-материалы"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Аналитика"])