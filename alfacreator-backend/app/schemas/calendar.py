from pydantic import BaseModel
from typing import List, Optional

class CalendarRequest(BaseModel):
    business_id: int
    business_description: str
    sales_summary: Optional[str] = None
    engagement_summary: Optional[str] = None
    preferred_days: Optional[List[str]] = None  # ["Понедельник", "Пятница"]

class CalendarRecommendation(BaseModel):
    activity_type: str
    suggested_date: str
    reason: Optional[str] = None

class CalendarResponse(BaseModel):
    recommendations: List[CalendarRecommendation]
