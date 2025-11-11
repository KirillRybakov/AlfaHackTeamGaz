# app/schemas/analytics.py
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class TaskResponse(BaseModel):
    task_id: str = Field(..., example="a1b2c3d4-e5f6-7890-1234-567890abcdef")
    status: str = Field("processing", example="processing")

class AnalyticsResult(BaseModel):
    insights: str
    chart_data: Dict[str, Any]

class TaskStatusResponse(BaseModel):
    status: str = Field(..., example="complete")
    result: Optional[AnalyticsResult] = None