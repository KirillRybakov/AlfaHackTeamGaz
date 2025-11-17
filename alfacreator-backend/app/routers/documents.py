from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.documents import DocumentRequest, DocumentResponse
from app.core.dependencies import get_db, get_current_user
from app.schemas import user as user_schema
from app.services import document_service

router = APIRouter()

@router.post("/generate", response_model=DocumentResponse)
async def generate_document(
    request: DocumentRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: user_schema.User = Depends(get_current_user)
):
    try:
        generated_text = await document_service.generate_document_logic(
            request=request, 
            db=db, 
            user_id=current_user.id
        )
        return DocumentResponse(generated_text=generated_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации документа: {str(e)}")
