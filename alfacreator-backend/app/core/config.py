from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Класс для управления конфигурацией приложения из переменных окружения.
    """
    OLLAMA_MODEL: str = "llama3:8b"
    OLLAMA_HOST: str = "http://localhost:11434"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
