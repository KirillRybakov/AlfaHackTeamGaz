# alfacreator-backend/app/schemas/analytics.py

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Union

# Этот класс мы случайно удалили. Возвращаем его.
# Он используется для ответа от эндпоинта /upload
class TaskResponse(BaseModel):
    task_id: str = Field(..., example="a1b2c3d4-e5f6-7890-1234-567890abcdef")
    status: str = Field("processing", example="processing")

# --- Остальные классы, которые мы уже добавили ---

# Модель для успешного результата
class AnalyticsSuccessResult(BaseModel):
    insights: str
    chart_data: Dict[str, Any]

# Модель для результата с ошибкой
class AnalyticsErrorResult(BaseModel):
    error_message: str

# Главная модель статуса, которая может содержать один из трех вариантов
class TaskStatusResponse(BaseModel):
    status: str = Field(..., example="complete")
    # Поле result теперь может быть одним из трех типов
    result: Optional[Union[AnalyticsSuccessResult, AnalyticsErrorResult]] = None