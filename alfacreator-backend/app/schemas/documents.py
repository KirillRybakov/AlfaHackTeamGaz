# alfacreator-backend/app/schemas/documents.py

from pydantic import BaseModel, Field
from typing import Dict, Any # <-- Изменение здесь

class DocumentRequest(BaseModel):
    template_name: str = Field(..., example="invoice")
    details: Dict[str, Any] = Field(..., example={"Имя клиента": "ООО Ромашка", "Сумма": 5000})

class DocumentResponse(BaseModel):
    generated_text: str