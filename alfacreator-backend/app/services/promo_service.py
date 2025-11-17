import json
import re
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.llm_client import llm_client
from app.schemas.promo import PromoRequest
from app.schemas import history as history_schema
from app import crud


def _parse_llm_response_safely(response_str: str, user_id: int) -> List[str]:
    results = []
    try:
        match = re.search(r'(\[[\s\S]*\])', response_str)
        if match:
            json_str = match.group(1)
            parsed_data = json.loads(json_str)
            if isinstance(parsed_data, list):
                results = [str(item).strip() for item in parsed_data if isinstance(item, str)]
    except Exception as e:
        logger.warning(f"Robust JSON parsing failed for user {user_id}. Error: {e}. Trying fallback.")

    if not results:
        try:
            found_strings = re.findall(r'"(.*?)"', response_str)
            results = [s.strip() for s in found_strings]
        except Exception as e:
            logger.error(f"Fallback regex parsing also failed for user {user_id}. Error: {e}")

    final_results = [
        res for res in results
        if len(res) > 15 and not res.startswith(('http:', 'https:', 'www.'))
    ]

    if not final_results:
        logger.warning(f"Could not extract any valid content for user {user_id}. Response was: {response_str}")

    return final_results


async def generate_promo_logic(
        request: PromoRequest,
        db: AsyncSession,
        user_id: int
) -> list[str]:
    prompt = (
        "Ты — SMM-копирайтер. Создай 3 уникальных рекламных поста.\n"
        "Информация:\n"
        f"- Продукт: {request.product_description}\n"
        f"- Аудитория: {request.audience}\n"
        f"- Тональность: {request.tone}\n\n"
        "КРИТИЧЕСКИЕ ПРАВИЛА ВЫВОДА:\n"
        "1. Твой ответ должен быть ТОЛЬКО валидным JSON-массивом из 3 строк.\n"
        "2. Результат должен содержать ТОЛЬКО ТЕКСТ. Не добавляй URL-ссылки, хештеги или что-либо еще, кроме самих рекламных текстов.\n"
        "3. Весь текст должен быть полностью на русском языке.\n"
        "Пример ответа: [\"Первый пост...\", \"Второй пост...\", \"Третий пост...\"]"
    )

    try:
        response_str = await llm_client.generate_json_response(prompt)
        results = _parse_llm_response_safely(response_str, user_id)

        if not results:
            raise ValueError("LLM returned an empty or unparsable result, possibly due to safety filters.")

        history_entry_data = history_schema.HistoryCreate(
            request_type="promo",
            input_data=request.model_dump(),
            output_data={"results": results}
        )
        await crud.create_history_entry(db=db, user_id=user_id, entry=history_entry_data)

        return results

    except Exception as e:
        logger.error(f"Error in promo generation logic for user {user_id}: {e}", exc_info=True)
        raise
