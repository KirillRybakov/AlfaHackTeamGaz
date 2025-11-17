from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.schemas.documents import DocumentRequest
from app.services.template_store import TEMPLATES
from app.core.llm_client import llm_client
from app.schemas import history as history_schema
from app import crud

async def generate_document_logic(
    request: DocumentRequest,
    db: AsyncSession,
    user_id: int
) -> str:
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
        response = await llm_client.client.generate(
            model=llm_client.model, prompt=prompt, stream=False
        )
        generated_text = response['response'].strip()

        history_entry_data = history_schema.HistoryCreate(
            request_type="document",
            input_data=request.model_dump(),
            output_data={"generated_text": generated_text}
        )
        await crud.create_history_entry(
            db=db, user_id=user_id, entry=history_entry_data
        )
        
        return generated_text
    except Exception as e:
        raise e
