# alfacreator-backend/app/services/rag_service.py

import chromadb
from sentence_transformers import SentenceTransformer
from loguru import logger
import json
import httpx
from app.core.llm_client import llm_client

# --- Инициализация RAG ---
embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
# Используем PersistentClient и указываем путь к сохраненной БД
client = chromadb.PersistentClient(path="./chroma_db")
try:
    collection = client.get_collection(name="smm_assistant_kb")
    RAG_ENABLED = True
except Exception:
    RAG_ENABLED = False
    logger.warning("Коллекция ChromaDB 'smm_assistant_kb' не найдена. RAG будет отключен.")

# --- ОПИСАНИЕ ИНСТРУМЕНТОВ, ДОСТУПНЫХ БОТУ ---
TOOLS_PROMPT = """
У тебя есть доступ к следующим инструментам (функциям) нашего приложения:

1.  **generate_promo(product_description: str, audience: str, tone: str)**
    *   Описание: Генерирует 3 варианта рекламных постов.
    *   Когда использовать: Если пользователь просит "придумать пост", "написать рекламу", "сделать промо".
    *   ПРАВИЛО: Если из запроса НЕВОЗМОЖНО извлечь хотя бы `product_description`, НЕ ИСПОЛЬЗУЙ этот инструмент. Вместо этого используй `clarify` и спроси, о чем должен быть пост.

2.  **generate_document(template_name: str, details: dict)**
    *   Описание: Генерирует юридический или финансовый документ по шаблону.
    *   Доступные шаблоны (`template_name`): `invoice` (счет), `service_contract` (договор), `completion_act` (акт).
    *   ПРАВИЛО 1: Твоя задача — вести себя как заполнитель анкеты. Проанализируй запрос пользователя и извлеки из него МАКСИМУМ возможных данных для полей шаблона. Поля: "Номер счета", "Дата счета", "Имя клиента", "Сумма", "Ваше ИП/ООО" и т.д.
    *   ПРАВИЛО 2: Если пользователь просит "сделать документ", но НЕ УТОЧНЯЕТ КАКОЙ, используй `clarify` и спроси, какой именно документ нужен.

3.  **search_knowledge_base(query: str)**
    *   Описание: Ищет ответ на вопрос в базе знаний (SMM-курсы, регламенты).
    *   Когда использовать: Если вопрос явно теоретический (например, "что такое...", "какие обязанности...").

4.  **navigate_ui(feature_name: str)**
    *   Описание: Объясняет, как найти функцию в интерфейсе.
    *   Когда использовать: Если пользователь спрашивает "где найти", "как открыть".
"""

# --- СУПЕР-УЛУЧШЕННЫЙ СИСТЕМНЫЙ ПРОМПТ ---
SYSTEM_PROMPT_WITH_TOOLS = f"""
Ты — 'Альфа-Ассистент', умный и сверхточный помощник в приложении 'Альфа-Креатор'.

ТВОЯ ГЛАВНАЯ ЗАДАЧА: Проанализировать запрос пользователя и выбрать ОДИН правильный инструмент для его выполнения.

{TOOLS_PROMPT}

ПЛАН ДЕЙСТВИЙ:
1.  Проанализируй запрос пользователя.
2.  Выбери ЛУЧШИЙ инструмент. Строго следуй ПРАВИЛАМ для каждого инструмента.
3.  Сформируй JSON-объект с вызовом этого инструмента.

ОСОБЫЕ ПРАВИЛА:
-   Если запрос — бессмыслица или бытовой (например, "я поел пельмени"), используй инструмент `unrelated_query`.
-   Если не хватает данных для ВЫЗОВА инструмента, используй `clarify`.
-   Если пользователь просто здоровается или спрашивает "что ты умеешь?", используй `greet`.
-   Твой ответ ВСЕГДА — это ТОЛЬКО JSON.

ФОРМАТЫ JSON:
-   Для вызова инструмента: `{{ "tool_name": "...", "parameters": {{...}} }}`
-   Для уточнения: `{{ "tool_name": "clarify", "parameters": {{ "question": "..." }} }}`
-   Для приветствия: `{{ "tool_name": "greet", "parameters": {{}} }}`
-   Для нерелевантных запросов: `{{ "tool_name": "unrelated_query", "parameters": {{}} }}`
"""


# --- АСИНХРОННАЯ ФУНКЦИЯ ДЛЯ ВЫЗОВА API ---
async def call_api(method: str, endpoint: str, data: dict = None, json_data: dict = None):
    base_url = "http://backend:8000/api/v1"  # Docker-внутренний адрес бэкенда
    async with httpx.AsyncClient(timeout=120.0) as client:  # Увеличиваем тайм-аут
        try:
            if method.upper() == "POST":
                response = await client.post(f"{base_url}{endpoint}", data=data, json=json_data)
            else:  # GET
                response = await client.get(f"{base_url}{endpoint}")

            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Ошибка API при вызове {endpoint}: {e.response.text}")
            return {"error": f"Ошибка API: {e.response.text}"}
        except Exception as e:
            logger.error(f"Критическая ошибка при вызове API {endpoint}: {e}")
            return {"error": "Внутренняя ошибка сервера при выполнении запроса."}


# --- ГЛАВНАЯ ФУНКЦИЯ ---
async def get_bot_response(user_query: str, llm_client) -> str:
    # --- ЭТАП 1: ВЫБОР ИНСТРУМЕНТА ---
    tool_selection_prompt = f"{SYSTEM_PROMPT_WITH_TOOLS}\n\nЗапрос пользователя:\n---\n{user_query}\n---\n\nТвой JSON с выбором инструмента:"

    try:
        response_str = await llm_client.generate_json_response(tool_selection_prompt)
        # Дополнительная защита от "мусора"
        json_start = response_str.find('{')
        json_end = response_str.rfind('}')
        if json_start == -1 or json_end == -1:
            raise ValueError("Не найден JSON в ответе LLM")
        clean_json_str = response_str[json_start:json_end + 1]

        tool_call = json.loads(clean_json_str)
        tool_name = tool_call.get("tool_name")
        parameters = tool_call.get("parameters", {})
    except Exception as e:
        logger.error(f"Ошибка выбора инструмента или парсинга JSON: {e}\nОтвет LLM: {response_str}")
        return "К сожалению, я не смог понять ваш запрос. Попробуйте переформулировать."

    logger.info(f"Ассистент выбрал инструмент: {tool_name} с параметрами: {parameters}")

    # --- ЭТАП 2: ВЫПОЛНЕНИЕ ИНСТРУМЕНТА ---
    if tool_name == "greet":
        return "Привет! Я Альфа-Ассистент. Я могу помочь вам сгенерировать промо-посты, создать документы, найти информацию в базе знаний или проанализировать данные. Что бы вы хотели сделать?"

    elif tool_name == "generate_promo":
        api_response = await call_api("POST", "/promo/generate", json_data=parameters)
        if "error" in api_response or "detail" in api_response:
            return f"Произошла ошибка при генерации промо: {api_response.get('error') or api_response.get('detail')}"
        posts = api_response.get("results", [])
        return "Готово! Вот несколько идей для постов:\n\n" + "\n".join([f"- {post}" for post in posts])

    elif tool_name == "generate_document":
        api_response = await call_api("POST", "/documents/generate",
                                      json_data={"template_name": parameters.get("template_name"),
                                                 "details": parameters.get("details", {})})
        if "error" in api_response or "detail" in api_response:
            return f"Произошла ошибка при создании документа: {api_response.get('error') or api_response.get('detail')}"
        doc_text = api_response.get("generated_text", "")
        return f"Документ '{parameters.get('template_name')}' готов! Вы можете скопировать текст ниже:\n\n---\n{doc_text}"

    elif tool_name == "navigate_ui":
        feature = parameters.get('feature_name', 'нужный раздел')
        return f"Чтобы найти '{feature}', просто перейдите в соответствующую вкладку в верхнем меню."


    elif tool_name == "search_knowledge_base":

        if not RAG_ENABLED:
            return "К сожалению, моя база знаний сейчас недоступна."

        rag_query = parameters.get("query")

        if not rag_query:
            return "Пожалуйста, уточните, что именно вы хотите найти."
        query_embedding = embedding_model.encode([rag_query])
        results = collection.query(query_embeddings=query_embedding, n_results=1)

        if not results['documents'] or not results['documents'][0]:
            return "К сожалению, я не нашел точной информации по вашему вопросу в базе знаний."

        context = results['documents'][0][0]
        final_prompt = f"""
                Ты должен ответить на вопрос пользователя, основываясь ИСКЛЮЧИТЕЛЬНО на предоставленном ниже КОНТЕКСТЕ.
                1. Прочитай КОНТЕКСТ.
                2. Если он релевантен вопросу, дай четкий ответ на его основе.
                3. Если КОНТЕКСТ не помогает ответить на вопрос, скажи: "Я нашел в базе знаний похожую информацию, но она не отвечает на ваш вопрос напрямую. Могу я помочь чем-то еще?".
                4. Отвечай на русском языке.

                КОНТЕКСТ:
                ---
                {context}
                ---
                ВОПРОС: '{rag_query}'
                """
        response = await llm_client.client.generate(model=llm_client.model, prompt=final_prompt, stream=False)
        return response['response'].strip()

    elif tool_name == "unrelated_query":
        return "Я — ассистент для решения бизнес-задач. К сожалению, я не могу поддержать разговор на бытовые темы. Могу я помочь вам сгенерировать контент или документ?"

    else:
        return "Я понял, что вы хотите сделать, но пока не умею выполнять такие действия. Попробуйте спросить что-то другое."