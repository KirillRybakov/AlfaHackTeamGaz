from pydantic import BaseModel
from typing import Optional

class SocialMediaInfo(BaseModel):
    platform: str
    identifier: Optional[str] = None
    analysis_summary: str
