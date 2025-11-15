# alfacreator-backend/app/routers/smm_bot_router.py
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from app.services.rag_service import get_bot_response  # <-- Важно, что этот сервис уже умеет работать с текстом
from app.core.llm_client import llm_client

router = APIRouter()


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def handle_chat_message(
        message: str = Form(""),
        file: Optional[UploadFile] = File(None)
):
    query = message

    if file:
        # Здесь мы должны извлечь текст из файла и добавить его к запросу
        # Это потребует доработки rag_service, пока просто добавим уведомление
        # В реальном проекте здесь будет вызов parse_pdf/parse_docx
        contents = await file.read()
        # file_text = parse_document(contents, file.filename) # Псевдокод
        file_text = f"\n\n--- НАЧАЛО СОДЕРЖИМОГО ФАЙЛА {file.filename} ---\n[...содержимое файла...]\n--- КОНЕЦ ФАЙЛА ---"
        query += file_text

    bot_reply = await get_bot_response(query, llm_client)
    return ChatResponse(reply=bot_reply)