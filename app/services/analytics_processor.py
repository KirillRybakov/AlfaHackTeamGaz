# app/services/analytics_processor.py
import pandas as pd
import json
from loguru import logger
from app.core.llm_client import llm_client

# Временное хранилище для статуса задач. В production можно заменить на Redis.
TASK_STORAGE = {}


async def process_sales_file(task_id: str, file_path: str):
    """
    Фоновая задача для асинхронной обработки и анализа CSV файла.
    """
    try:
        logger.info(f"[{task_id}] Начало обработки файла: {file_path}")
        df = pd.read_csv(file_path)

        # Пример базового анализа
        total_revenue = df['price'].sum()
        top_product = df['product'].mode()[0]
        sales_by_day = df.groupby('day_of_week')['price'].sum().to_dict()

        summary = (
            f"Общая выручка: {total_revenue:.2f} руб. "
            f"Самый популярный продукт: '{top_product}'. "
            f"Распределение продаж по дням: {sales_by_day}."
        )
        logger.info(f"[{task_id}] Сводка по данным: {summary}")

        prompt = (
            "Ты — опытный бизнес-аналитик для владельца малого бизнеса. "
            f"Вот сводка по продажам: {summary}\n\n"
            "Твоя задача — предоставить краткий анализ и рекомендации. "
            "ВАЖНО: Твой ответ должен быть СТРОГО в формате валидного JSON-объекта со следующими ключами:\n"
            "1. `insights` (string): Краткий вывод (2-3 предложения) и одна конкретная рекомендация.\n"

            "2. `chart_data` (object): Объект с данными для графика. Должен содержать ключи `labels` (массив дней недели, например [\"Пн\", \"Вт\"]) и `values` (массив числовых значений продаж для этих дней)."
        )

        llm_response_str = await llm_client.generate_json_response(prompt)
        llm_response_data = json.loads(llm_response_str)

        TASK_STORAGE[task_id] = {"status": "complete", "result": llm_response_data}
        logger.info(f"[{task_id}] Обработка завершена успешно.")

    except Exception as e:
        logger.error(f"[{task_id}] Ошибка при обработке файла: {e}")
        TASK_STORAGE[task_id] = {"status": "error", "result": {"error_message": str(e)}}