# alfacreator-backend/app/routers/promo.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import json
from loguru import logger
from app.schemas.promo import PromoRequest, PromoResponse
from app.core.llm_client import llm_client
from app.database import get_db
from app import crud

router = APIRouter()


@router.post("/generate", response_model=PromoResponse)
async def generate_promo(request: PromoRequest, db: AsyncSession = Depends(get_db)):
    prompt = (
        "Ты — профессиональный SMM-копирайтер. Создай 3 уникальных, коротких рекламных поста.\n"
        "Информация:\n"
        f"- Продукт: {request.product_description}\n"
        f"- Целевая аудитория: {request.audience}\n"
        f"- Тональность: {request.tone}\n\n"
        "КРИТИЧЕСКИ ВАЖНО: Твой ответ должен быть СТРОГО в формате валидного JSON-массива (списка) из 3 строк. "
        "НЕ ИСПОЛЬЗУЙ никаких ключей или объектов, просто голый массив. "
        "Пример: [\"Первый текст...\", \"Второй текст...\", \"Третий текст...\"]\n\n"
        "Отвечай СТРОГО на русском языке."
    )

    try:
        response_str = await llm_client.generate_json_response(prompt)

        results = []
        try:
            start_index = response_str.find('{') if response_str.find('[') == -1 else response_str.find('[')
            end_index = response_str.rfind('}') if response_str.rfind(']') == -1 else response_str.rfind(']')
            if start_index != -1 and end_index != -1:
                json_str = response_str[start_index:end_index + 1]
                data = json.loads(json_str)
            else:
                data = json.loads(response_str)

            if isinstance(data, list):
                results = [item for item in data if isinstance(item, str) and item]
            elif isinstance(data, dict):
                found_list = False
                for key, value in data.items():
                    if isinstance(value, list) and all(isinstance(item, str) for item in value):
                        results = [item for item in value if item]
                        found_list = True
                        break
                if not found_list:
                    results = [key for key in data.keys() if isinstance(key, str) and len(key) > 20]
        except Exception as e:
            logger.warning(f"Не удалось распарсить JSON, пытаемся извлечь текст регулярными выражениями. Ошибка: {e}")
            import re
            found_strings = re.findall(r'"([^"]+)"', response_str)
            results = [s for s in found_strings if len(s) > 20 and not s.startswith(('{', '[', '}', ']'))]

        if not results:
            raise ValueError("LLM вернула пустой или непонятный результат")

        clean_results = [res.split('"}')[0].strip() for res in results]

        # --- СОХРАНЯЕМ В ИСТОРИЮ ---
        await crud.create_history_entry(
            db=db,
            request_type="promo",
            input_data=request.model_dump(),
            output_data={"results": clean_results}
        )
        # -------------------------

        return PromoResponse(results=clean_results)

    except Exception as e:
        logger.error(f"Критическая ошибка в эндпоинте promo: {e}")
        raise HTTPException(status_code=500, detail=f"Критическая ошибка бэкенда: {str(e)}")