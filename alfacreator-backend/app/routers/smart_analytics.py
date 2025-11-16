# alfacreator-backend/app/routers/smart_analytics_router.py

import io
import json
import pandas as pd
import httpx

from fastapi import (
    APIRouter, UploadFile, Form, HTTPException, Query, File, Depends
)
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

# --- ИСПРАВЛЕННЫЙ БЛОК ИМПОРТОВ ---
from app.services import social_parser # Импортируем модуль целиком
from app.schemas.socialmedia import SocialMediaInfo
from app.core.llm_client import llm_client
from app.database import get_db
from app import crud

router = APIRouter()

@router.get("/analyze/social", response_model=SocialMediaInfo)
async def get_social_analysis(link: str = Query(..., description="Ссылка на соцсеть для анализа")):
    # Используем полный путь
    analysis_result = await social_parser.analyze_social(link)
    if not analysis_result:
        raise HTTPException(
            status_code=400,
            detail="Не удалось распознать ссылку или соцсеть не поддерживается."
        )
    return analysis_result

@router.post("/smart")
async def analyze_business(
        db: AsyncSession = Depends(get_db),
        file: Optional[UploadFile] = File(None),
        link: Optional[str] = Form(None)
):
    if not file and not link:
        raise HTTPException(status_code=400, detail="Необходимо предоставить файл или ссылку.")

    try:
        user_data_summary = "Данные из файла не предоставлены."
        if file:
            contents = await file.read()
            df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith(".csv") else pd.read_excel(io.BytesIO(contents))
            user_data_summary = summarize_client_data(df)

        social_data_summary = "Ссылка на соцсеть не указана."
        if link:
            # Используем полный путь
            social_info = await social_parser.analyze_social(link)
            if social_info:
                social_data_summary = social_info.analysis_summary
            else:
                social_data_summary = "Ссылка указана, но распознать соцсеть не удалось."

        trends = await get_latest_trends()

        prompt = f"""
        Ты — профессиональный SMM-стратег для российского малого бизнеса.
        Твоя задача — создать детальный и практичный контент-план на 7 дней.
        Твой ответ ДОЛЖЕН БЫТЬ ПОЛНОСТЬЮ на русском языке, включая ключи в JSON.

        Проанализируй информацию о бизнесе клиента:
        📊 Клиентские данные:
        {user_data_summary}

        🌐 Анализ соцсетей ({link}):
        {social_data_summary}

        🔥 Актуальные тренды в России:
        {trends}

        Основываясь на этих данных, выполни два шага:
        1. Сформулируй 2-3 ключевые рекомендации для быстрого улучшения.
        2. Составь пошаговый контент-план на неделю.

        ВАЖНО: Ответ должен быть СТРОГО в формате валидного JSON на русском языке. Вот структура:
        {{
        "kratkieRekomendatsii": [
            "Краткая ключевая рекомендация №1...",
            "Краткая ключевая рекомендация №2..."
        ],
        "celNaNedelyu": "Сформулируй здесь главную цель на неделю (например, 'Привлечь 10 новых подписчиков из целевой аудитории через Reels').",
        "kontentPlan": [
            {{
            "den": "Понедельник",
            "tema": "Тема дня (например, 'Образовательный контент')",
            "ideyaPosta": "Конкретная идея для поста (например, 'Видео-риллс: показываем, как правильно заваривать воронку V60. Крупные планы, эстетика.')",
            "format": "Reels",
            "prizyvKDeystviyu": "Призыв к действию (например, 'Какой этап заваривания для вас самый сложный? Напишите в комментариях!')"
            }},
            {{
            "den": "Вторник",
            "tema": "...",
            "ideyaPosta": "...",
            "format": "...",
            "prizyvKDeystviyu": "..."
            }}
        ]
        }}
        """

        result_str = await llm_client.generate_json_response(prompt)
        result_data = json.loads(result_str)

        # --- ВОТ ЭТОТ БЛОК МЫ ЗАБЫЛИ ---
        await crud.create_history_entry(
            db=db,
            request_type="smart_analytics",
            input_data={"link": link, "filename": file.filename if file else "Нет файла"},
            output_data=result_data
        )
        # LLM возвращает строку. Ее нужно распарсить и вернуть как JSON.
        return JSONResponse(content=json.loads(result_str))

    except Exception as e:
        # Используйте HTTPException для корректной отправки кодов ошибок
        raise HTTPException(status_code=500, detail=str(e))


def summarize_client_data(df: pd.DataFrame) -> str:
    """
    Простейший анализ CSV/Excel — структура, количество записей, средние значения.
    """
    info = f"Найдено {len(df)} строк. Колонки: {', '.join(df.columns)}."
    if "amount" in df.columns:
        avg_amount = df["amount"].mean()
        info += f" Средний чек: {avg_amount:.2f}."
    return info


async def get_latest_trends() -> str:
    """
    Получение трендов (пока заглушка, но можно подключить реальный API).
    """
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("https://trends.google.com/trending/rss?geo=RU")
            if res.status_code == 200:
                return "Google Trends: популярные темы недели."
    except:
        pass
    return "Тренды не удалось получить."
