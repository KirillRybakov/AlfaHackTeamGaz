from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user
from app.schemas import user as user_schema
from app.schemas import history as history_schema
from app import crud

from app.services.rag_service import get_bot_response
from app.core.llm_client import llm_client


router = APIRouter()


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def handle_chat_message(

        db: AsyncSession = Depends(get_db),
        current_user: user_schema.User = Depends(get_current_user),

        message: str = Form(""),
        file: Optional[UploadFile] = File(None)
):
    if not message and not file:
        raise HTTPException(status_code=400, detail="Сообщение или файл должны быть предоставлены.")

    query = message
    input_data_for_history = {"message": message}

    if file:

        contents = await file.read()
        file_text = f"\n\n--- Приложен файл: {file.filename} ---"
        query += file_text
        input_data_for_history["filename"] = file.filename

    bot_reply = await get_bot_response(
        query=query, 
        llm_client=llm_client,
        user_id=current_user.id
    )

    history_entry_data = history_schema.HistoryCreate(
        request_type="smm_bot",
        input_data=input_data_for_history,
        output_data={"reply": bot_reply}
    )
    await crud.create_history_entry(
        db=db,
        user_id=current_user.id,
        entry=history_entry_data
    )

    return ChatResponse(reply=bot_reply)
