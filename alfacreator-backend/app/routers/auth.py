from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from fastapi.concurrency import run_in_threadpool # <-- 1. ИМПОРТИРУЕМ УТИЛИТУ

from app import crud
from app.schemas import user as user_schema, token as token_schema
from app.core import security
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings

router = APIRouter()

# Эндпоинт register у вас уже написан идеально, оставляем как есть
@router.post("/register", response_model=user_schema.User)
async def register(user: user_schema.UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user(db=db, user=user)


@router.post("/token", response_model=token_schema.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await crud.get_user_by_email(db, email=form_data.username)

    # 2. Оборачиваем блокирующий вызов в run_in_threadpool
    if not user or not await run_in_threadpool(security.verify_password, form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Небольшое улучшение: передаем expires_delta в функцию, чтобы сделать ее более явной
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=user_schema.User)
async def read_users_me(current_user: user_schema.User = Depends(get_current_user)):
    return current_user


# --- ЭНДПОИНТЫ ПРОФИЛЯ ---
@router.patch("/users/me", response_model=user_schema.User)
async def update_current_user(
    update_data: user_schema.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: user_schema.User = Depends(get_current_user)
):
    # Проверка, если новый email уже занят (опционально)
    if update_data.email and update_data.email != current_user.email:
        existing_user = await crud.get_user_by_email(db, email=update_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Этот email уже используется другим пользователем.")
    return await crud.update_user(db=db, user=current_user, update_data=update_data)


@router.post("/users/me/change-password")
async def change_current_user_password(
    password_data: user_schema.PasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: user_schema.User = Depends(get_current_user)
):
    is_correct_password = await run_in_threadpool(
        security.verify_password, password_data.current_password, current_user.hashed_password
    )
    if not is_correct_password:
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
        
    current_user.hashed_password = security.get_password_hash(password_data.new_password)
    db.add(current_user)
    await db.commit()
    
    return {"message": "Пароль успешно изменен"}