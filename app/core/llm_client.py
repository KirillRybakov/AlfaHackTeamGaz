# app/core/llm_client.py
import ollama
from loguru import logger
from app.core.config import settings

class LLMClient:
    """
    Асинхронный клиент для взаимодействия с сервером Ollama.
    """
    def __init__(self, model: str, host: str):
        self.model = model
        # Инициализируем асинхронный клиент с указанием хоста
        self.client = ollama.AsyncClient(host=host)
        logger.info(f"LLM-клиент инициализирован для модели '{self.model}' на хосте '{host}'")

    async def generate_json_response(self, prompt: str) -> str:
        """
        Отправляет промпт в Ollama и запрашивает ответ в формате JSON.
        Возвращает строковое представление JSON ответа.
        """
        logger.info(f"Отправка промпта в модель '{self.model}'...")
        logger.debug(f"ПРОМПТ:\n---\n{prompt}\n---")

        try:
            response = await self.client.generate(
                model=self.model,
                prompt=prompt,
                format='json',  # Критически важный параметр для получения валидного JSON
                stream=False
            )
            logger.info("Ответ от LLM получен успешно.")
            return response['response']
        except Exception as e:
            logger.error(f"Ошибка при взаимодействии с Ollama: {e}")
            raise ConnectionError(f"Не удалось связаться с сервером Ollama. Убедитесь, что он запущен и доступен по адресу {self.client._client.host}. Ошибка: {e}")

# Создаем единый экземпляр клиента для всего приложения
llm_client = LLMClient(model=settings.OLLAMA_MODEL, host=settings.OLLAMA_HOST)