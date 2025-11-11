# app/routers/promo.py
from fastapi import APIRouter, HTTPException
import json
from loguru import logger
from app.schemas.promo import PromoRequest, PromoResponse
from app.core.llm_client import llm_client

router = APIRouter()


@router.post("/generate", response_model=PromoResponse)
async def generate_promo(request: PromoRequest):
    """
    Генерирует промо-материалы на основе описания, аудитории и тона.
    """
    prompt = (
        "Ты — профессиональный SMM-копирайтер для малого бизнеса. "
        "Твоя задача — создать 3 уникальных, коротких и цепляющих рекламных поста для соцсетей. "
        "Вот информация:\n"
        f"- Описание продукта: {request.product_description}\n"
        f"- Целевая аудитория: {request.audience}\n"
        f"- Желаемая тональность: {request.tone}\n\n"
        "ВАЖНО: Твой ответ должен быть СТРОГО в формате валидного JSON-массива, содержащего 3 строки. "
        "Пример: [\"Текст первого поста\", \"Текст второго поста\", \"Текст третьего поста\"]"
    )

    try:
        response_str = await llm_client.generate_json_response(prompt)
        results = json.loads(response_str)
        if not isinstance(results, list) or not all(isinstance(item, str) for item in results):
            logger.warning(f"LLM вернула некорректный формат: {results}")
            raise ValueError("LLM вернула некорректный JSON формат (не список строк)")
        return PromoResponse(results=results)
    except json.JSONDecodeError:
        logger.error(f"Не удалось распарсить JSON от LLM. Ответ: {response_str}")
        raise HTTPException(status_code=500, detail="LLM вернула невалидный JSON.")
    except Exception as e:
        logger.error(f"Непредвиденная ошибка при генерации промо: {e}")
        raise HTTPException(status_code=500, detail=str(e))