# alfacreator-backend/app/routers/analytics.py

import uuid
import os
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from app.schemas.analytics import TaskResponse, TaskStatusResponse
from app.services.analytics_processor import process_sales_file, TASK_STORAGE
import aiofiles

router = APIRouter()
UPLOAD_DIR = "temp_uploads"


@router.on_event("startup")
async def startup_event():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=TaskResponse, status_code=202)
async def upload_file_for_analysis(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Поддерживаются только CSV файлы")

    task_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{task_id}_{file.filename}")

    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    TASK_STORAGE[task_id] = {"status": "processing", "result": None}

    # Передаем имя файла в фоновую задачу для сохранения в истории
    input_data_for_history = {"filename": file.filename}
    background_tasks.add_task(process_sales_file, task_id, file_path, input_data_for_history)

    return TaskResponse(task_id=task_id, status="processing")


@router.get("/results/{task_id}", response_model=TaskStatusResponse)
async def get_analysis_results(task_id: str):
    task = TASK_STORAGE.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача с таким ID не найдена")
    return TaskStatusResponse(status=task.get("status"), result=task.get("result"))