# alfacreator-backend/app/routers/history.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app import crud
from app.schemas import history as history_schema
from app.schemas import user as user_schema
from app.core.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/", response_model=List[history_schema.History])
async def read_history_for_current_user(

    request_type: Optional[str] = Query(None, description="Тип запроса для фильтрации (например, 'promo')"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: user_schema.User = Depends(get_current_user),
):
    """
    Получает историю запросов для текущего аутентифицированного пользователя.
    Можно отфильтровать по типу запроса.
    """

    history_entries = await crud.get_history_entries(
        db=db, 
        user_id=current_user.id, 
        request_type=request_type, 
        skip=skip, 
        limit=limit
    )
    return history_entries
