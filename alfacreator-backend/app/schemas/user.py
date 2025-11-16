# alfacreator-backend/app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)


# Схема для обновления данных пользователя (все поля опциональны)
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None # Оставляем возможность смены email
    company_name: Optional[str] = None
    job_title: Optional[str] = None

# Схема для смены пароля
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=72)

# Основная схема пользователя, которую мы возвращаем клиенту
# (обновлена, чтобы включать full_name)
class User(UserBase):
    id: int
    full_name: Optional[str] = None # Добавляем это поле
    company_name: Optional[str] = None
    job_title: Optional[str] = None

    class Config:
        from_attributes = True