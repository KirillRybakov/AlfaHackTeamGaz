from fastapi import APIRouter, HTTPException
from loguru import logger
import json
from app.schemas.calendar import CalendarRequest, CalendarResponse
from app.core.llm_client import llm_client

router = APIRouter()


@router.post("/recommend", response_model=CalendarResponse)
async def recommend_calendar(request: CalendarRequest):
    """
    Анализирует бизнес-данные и предлагает оптимальное время
    для акций, публикаций и маркетинговых активностей.
    """
    prompt = (
        "Ты — умный маркетинговый аналитик. "
        "На основе данных о бизнесе предложи оптимальные даты для маркетинговых активностей.\n\n"
        "Формат ответа: строго JSON-массив объектов вида:\n"
        "[\n"
        "  {\"activity_type\": \"discount\", \"suggested_date\": \"2025-11-15\", \"reason\": \"Выходные и высокий спрос\"},\n"
        "  {\"activity_type\": \"post\", \"suggested_date\": \"2025-11-18\", \"reason\": \"Пик активности аудитории\"}\n"
        "]\n\n"
        "Информация о бизнесе:\n"
        f"- ID бизнеса: {request.business_id}\n"
        f"- Описание: {request.business_description}\n"
        f"- История продаж: {request.sales_summary}\n"
        f"- Активность в соцсетях: {request.engagement_summary}\n"
        f"- Предпочитаемые дни для публикаций: {request.preferred_days}\n\n"
        "Отвечай строго на русском языке. Не добавляй пояснений вне JSON."
    )

    try:
        response_str = await llm_client.generate_json_response(prompt)

        try:
            # Пытаемся извлечь JSON из ответа LLM
            start_index = response_str.find('[')
            end_index = response_str.rfind(']')
            if start_index != -1 and end_index != -1:
                json_str = response_str[start_index:end_index + 1]
                data = json.loads(json_str)
            else:
                data = json.loads(response_str)

            # Валидация
            if not isinstance(data, list):
                raise ValueError("LLM вернул неожиданный формат (не список)")

            clean_results = []
            for item in data:
                if not isinstance(item, dict):
                    continue
                if not all(k in item for k in ("activity_type", "suggested_date")):
                    continue
                clean_results.append(item)

            if not clean_results:
                raise ValueError(f"Не удалось извлечь корректные рекомендации: {response_str}")

            return CalendarResponse(recommendations=clean_results)

        except Exception as e:
            logger.warning(f"Ошибка парсинга JSON в календаре: {e}")
            raise HTTPException(status_code=500, detail="Ошибка обработки ответа LLM")

    except Exception as e:
        logger.error(f"Критическая ошибка в эндпоинте calendar: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка календаря: {str(e)}")
