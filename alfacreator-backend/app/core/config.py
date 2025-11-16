# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Класс для управления конфигурацией приложения из переменных окружения.
    """
    OLLAMA_MODEL: str = "llama3:8b"
    OLLAMA_HOST: str = "http://localhost:11434"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()