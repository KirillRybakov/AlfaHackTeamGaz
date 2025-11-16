# alfacreator-backend/app/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models
from typing import Optional


async def create_history_entry(db: AsyncSession, request_type: str, input_data: dict, output_data: dict):
    db_entry = models.History(request_type=request_type, input_data=input_data, output_data=output_data)
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry


async def get_history_entries(db: AsyncSession, request_type: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = select(models.History)
    if request_type:
        query = query.where(models.History.request_type == request_type)

    query = query.order_by(models.History.id.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()