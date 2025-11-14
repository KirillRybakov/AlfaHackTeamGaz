from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

# Импортируем все наши роутеры
from app.routers import promo, analytics, documents, smart_analytics, history, calendar
# Импортируем все для работы с БД
from app.database import engine, Base
from app import models


app = FastAPI(
    title="Альфа-Креатор API",
    description="API для генерации контента и аналитики для малого бизнеса.",
    version="1.0.0"
)

# Создание таблиц БД при запуске приложения
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Документы"])
app.include_router(smart_analytics.router, prefix="/api/v1/smart_analytics", tags=["Умная Аналитика"])
app.include_router(history.router, prefix="/api/v1/history", tags=["История"])
app.include_router(calendar.router, prefix="/api/v1/calendar", tags=["Умный календарь"])
