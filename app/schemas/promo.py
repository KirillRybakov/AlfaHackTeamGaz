# app/schemas/promo.py
from pydantic import BaseModel, Field
from typing import List

class PromoRequest(BaseModel):
    product_description: str = Field(..., min_length=10, example="Свежеобжаренный кофе из Эфиопии")
    audience: str = Field(..., example="студенты")
    tone: str = Field(..., example="дружелюбный")

class PromoResponse(BaseModel):
    results: List[str] = Field(..., example=["Текст 1", "Текст 2"])