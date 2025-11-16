# alfacreator-backend/app/schemas/history.py

from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict

# Эта конфигурация позволяет Pydantic читать данные из SQLAlchemy-объектов
class Config:
    from_attributes = True

class HistoryBase(BaseModel):
    request_type: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]

class History(HistoryBase):
    id: int
    created_at: datetime

    class Config(Config):
        pass # Наследуем конфигурацию