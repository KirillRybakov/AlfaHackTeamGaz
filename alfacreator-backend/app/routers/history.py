# alfacreator-backend/app/routers/history.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app import crud
from typing import List, Optional
from app.schemas.history import History

router = APIRouter()

@router.get("/", response_model=List[History])
async def read_history(
    request_type: Optional[str] = Query(None, description="Фильтр по типу запроса: 'promo', 'analytics', 'document'"),
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    history_entries = await crud.get_history_entries(db, request_type=request_type, skip=skip, limit=limit)
    return history_entries