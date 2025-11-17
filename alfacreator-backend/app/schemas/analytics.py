from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Union

class TaskResponse(BaseModel):
    task_id: str = Field(..., example="a1b2c3d4-e5f6-7890-1234-567890abcdef")
    status: str = Field("processing", example="processing")

class AnalyticsSuccessResult(BaseModel):
    insights: str
    chart_data: Dict[str, Any]


class AnalyticsErrorResult(BaseModel):
    error_message: str

class TaskStatusResponse(BaseModel):
    status: str = Field(..., example="complete")
    result: Optional[Union[AnalyticsSuccessResult, AnalyticsErrorResult]] = None
