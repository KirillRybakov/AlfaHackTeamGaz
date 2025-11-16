# alfacreator-backend/app/routers/documents.py
from fastapi import APIRouter, HTTPException, Depends # <--- ДОБАВЬ Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.documents import DocumentRequest, DocumentResponse
from app.services.template_store import TEMPLATES
from app.core.llm_client import llm_client
from app.database import get_db
from app import crud
import json
router = APIRouter()


@router.post("/generate", response_model=DocumentResponse)
async def generate_document(request: DocumentRequest, db: AsyncSession = Depends(get_db)):
    template = TEMPLATES.get(request.template_name)
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")

    details_str = "\n".join([f"- {key}: {value}" for key, value in request.details.items()])
    prompt = (
        "Ты — юридический ассистент. Твоя задача — аккуратно заполнить шаблон документа на основе предоставленных данных. "
        "Замени все значения в [квадратных скобках] на соответствующие данные от пользователя. "
        "Если каких-то данных нет, оставь placeholder [ДАННЫЕ НЕ УКАЗАНЫ]. "
        "Не добавляй никакого текста от себя, только итоговый текст документа.\n\n"
        "ШАБЛОН:\n---\n"
        f"{template}"
        "\n---\n\n"
        "ДАННЫЕ ДЛЯ ЗАПОЛНЕНИЯ:\n---\n"
        f"{details_str}"
        "\n---\n\n"
        "Отвечай СТРОГО на русском языке. Верни только готовый текст документа без каких-либо комментариев."
    )

    try:
        # Для этой задачи нам не нужен JSON, поэтому используем обычный generate
        response = await llm_client.client.generate(
            model=llm_client.model,
            prompt=prompt,
            stream=False
        )
        generated_text = response['response'].strip()
        # --- СОХРАНЯЕМ В ИСТОРИЮ ---
        await crud.create_history_entry(
            db=db,
            request_type="document",
            input_data=request.model_dump(),
            output_data={"generated_text": generated_text}
        )
        return DocumentResponse(generated_text=generated_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации документа: {e}")