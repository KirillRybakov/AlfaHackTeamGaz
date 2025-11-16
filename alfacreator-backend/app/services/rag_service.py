# alfacreator-backend/app/services/rag_service.py

import chromadb
from sentence_transformers import SentenceTransformer
from loguru import logger
import json
import re
from pydantic import ValidationError

from app.core.llm_client import llm_client, LLMClient
from app.database import AsyncSessionLocal
from app.services import promo_service, document_service
from app.schemas import promo as promo_schema
from app.schemas import documents as document_schema

# --- Инициализация ---
embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

DB_PATH = "/app/chroma_db"
client = chromadb.PersistentClient(path=DB_PATH)

try:
    collection = client.get_collection(name="smm_assistant_kb")
    RAG_ENABLED = True
    logger.info(f"Успешное подключение к коллекции 'smm_assistant_kb' в ChromaDB по пути: {DB_PATH}")

except Exception as e:
    RAG_ENABLED = False
    logger.warning(
        f"Коллекция ChromaDB 'smm_assistant_kb' не найдена по пути: {DB_PATH}. RAG будет отключен. Ошибка: {e}")

L2_RELEVANCE_THRESHOLD = 5
PROFANITY_KEYWORDS = {"мат", "дурак", "идиот"}
SMALL_TALK_PHRASES = {
    "привет": "Здравствуйте! Я Альфа-Ассистент. Чем могу помочь?",
    "здравствуй": "Здравствуйте! Я Альфа-Ассистент. Чем могу помочь?",
    "добрый день": "Добрый день! Я Альфа-Ассистент, готов помочь.",
    "спасибо": "Всегда рад помочь!",
    "пока": "До свидания!",
    "что ты умеешь": "Я могу помочь вам сгенерировать промо-посты, создать документы, найти информацию в базе знаний или проанализировать данные. Что бы вы хотели сделать?"
}
RESPONSE_PROFANITY = "Пожалуйста, соблюдайте вежливость в общении."
RESPONSE_OUT_OF_TOPIC = "Я — ассистент для решения бизнес-задач. К сожалению, я не могу поддержать разговор на бытовые темы."
RESPONSE_GIBBERISH = "Ваш запрос не содержит осмысленного текста. Попробуйте сформулировать его иначе."


def _is_gibberish(text: str) -> bool:
    text = text.strip()
    if not text or not re.search(r'[а-яА-Яa-zA-Z]', text):
        return True
    alphanumeric_chars = len(re.findall(r'[\w]', text))
    total_chars = len(text)
    if total_chars > 0 and (alphanumeric_chars / total_chars) < 0.5:
        return True
    return False


def censor_output(text: str) -> str:
    prompt_leak_words = ["контекст", "инструкц", "согласно предоставленному", "основываясь на"]
    if any(leak in text.lower() for leak in prompt_leak_words):
        logger.warning(f"ОБНАРУЖЕНА УТЕЧКА ПРОМПТА: '{text}'. Ответ будет заменен.")
        return "К сожалению, я не нашел точной информации по вашему вопросу."
    return text


# --- ОПИСАНИЕ ИНСТРУМЕНТОВ ---
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
    *   КРИТИЧЕСКОЕ ПРАВИЛО: Параметр `query` для этого инструмента ДОЛЖЕН БЫТЬ СТРОГО на русском языке. Если пользовательский запрос на другом языке, переведи его на русский перед вызовом.

4.  **navigate_ui(feature_name: str)**
    *   Описание: Объясняет, как найти функцию в интерфейсе.
    *   Когда использовать: Если пользователь спрашивает "где найти", "как открыть".
"""

# --- СИСТЕМНЫЙ ПРОМПТ ---
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


# --- ГЛАВНАЯ ФУНКЦИЯ ---
async def get_bot_response(query: str, llm_client: LLMClient, user_id: int) -> str:
    logger.info(f"Получен запрос от пользователя ID={user_id}: '{query}'")
    normalized_query = query.strip().lower()

    if _is_gibberish(normalized_query): return RESPONSE_GIBBERISH
    if any(profanity in normalized_query for profanity in PROFANITY_KEYWORDS): return RESPONSE_PROFANITY
    if normalized_query in SMALL_TALK_PHRASES: return SMALL_TALK_PHRASES[normalized_query]

    tool_selection_prompt = f"{SYSTEM_PROMPT_WITH_TOOLS}\n\nЗапрос пользователя:\n---\n{query}\n---\n\nТвой JSON с выбором инструмента:"
    try:
        response_str = await llm_client.generate_json_response(tool_selection_prompt)
        json_start = response_str.find('{')
        json_end = response_str.rfind('}')
        if json_start == -1 or json_end == -1: raise ValueError("Не найден JSON в ответе LLM")
        clean_json_str = response_str[json_start:json_end + 1]
        tool_call = json.loads(clean_json_str)
        tool_name = tool_call.get("tool_name")
        parameters = tool_call.get("parameters", {})
    except Exception as e:
        logger.error(f"Ошибка выбора инструмента для user_id={user_id}: {e}\nОтвет LLM: {response_str}")
        return "К сожалению, я не смог понять ваш запрос. Попробуйте переформулировать."

    logger.info(f"Ассистент для user_id={user_id} выбрал инструмент: {tool_name} с параметрами: {parameters}")

    async with AsyncSessionLocal() as db:
        try:
            final_response = ""
            if tool_name == "greet":
                final_response = SMALL_TALK_PHRASES.get("привет")
            elif tool_name == "generate_promo":
                promo_request_data = promo_schema.PromoRequest(**parameters)
                posts = await promo_service.generate_promo_logic(request=promo_request_data, db=db, user_id=user_id)
                final_response = "Готово! Вот несколько идей для постов:\n\n" + "\n".join(
                    [f"- {post}" for post in posts])
            elif tool_name == "generate_document":
                if 'details' not in parameters or not isinstance(parameters['details'], dict): parameters[
                    'details'] = {}
                doc_request_data = document_schema.DocumentRequest(**parameters)
                doc_text = await document_service.generate_document_logic(request=doc_request_data, db=db,
                                                                          user_id=user_id)
                final_response = f"Документ '{parameters.get('template_name')}' готов! Текст ниже:\n\n---\n{doc_text}"
            elif tool_name == "navigate_ui":
                feature = parameters.get('feature_name', 'нужный раздел')
                final_response = f"Чтобы найти '{feature}', просто перейдите в соответствующую вкладку в верхнем меню."

            elif tool_name == "search_knowledge_base":
                if not RAG_ENABLED:
                    final_response = "К сожалению, моя база знаний сейчас недоступна."
                else:
                    rag_query = parameters.get("query")
                    if not rag_query:
                        final_response = "Пожалуйста, уточните, что именно вы хотите найти."
                    else:
                        query_embedding = embedding_model.encode([rag_query])
                        results = collection.query(query_embeddings=query_embedding.tolist(), n_results=1,
                                                   include=["documents", "distances"])
                        distance = results.get('distances', [[999]])[0][0]
                        logger.info(f"RAG: Найден документ с евклидовым расстоянием (L2): {distance}")

                        if not results.get('documents') or not results['documents'][
                            0] or distance > L2_RELEVANCE_THRESHOLD:
                            logger.info(
                                f"RAG результат нерелевантен (расстояние {distance} > {L2_RELEVANCE_THRESHOLD}). Возврат к общим знаниям LLM.")

                            final_prompt = f"Ответь на вопрос пользователя кратко и понятно, СТРОГО на русском языке, как если бы ты был SMM-экспертом. Вопрос: '{rag_query}'"

                            response = await llm_client.client.generate(model=llm_client.model, prompt=final_prompt,
                                                                        stream=False)
                            final_response = response['response'].strip()
                        else:
                            logger.info("RAG результат релевантен. Ответ на основе контекста.")
                            context = results['documents'][0][0]
                            final_prompt = f"Ты должен ответить на вопрос пользователя, основываясь ИСКЛЮЧИТЕЛЬНО на предоставленном ниже КОНТЕКСТЕ.\nКОНТЕКСТ:\n---\n{context}\n---\nВОПРОС: '{rag_query}'"
                            response = await llm_client.client.generate(model=llm_client.model, prompt=final_prompt,
                                                                        stream=False)
                            final_response = response['response'].strip()

            elif tool_name == "unrelated_query":
                final_response = RESPONSE_OUT_OF_TOPIC
            elif tool_name == "clarify":
                final_response = parameters.get("question", "Не могли бы вы уточнить ваш запрос?")
            else:
                logger.warning(f"Неизвестный инструмент '{tool_name}' выбран для user_id={user_id}")
                final_response = "Я понял, что вы хотите сделать, но пока не умею выполнять такие действия."

            return censor_output(final_response)
        except ValidationError as e:
            logger.warning(f"Ошибка валидации параметров от LLM для '{tool_name}': {e}")
            return f"Я попытался использовать инструмент '{tool_name}', но мне не хватило данных. Не могли бы вы предоставить больше информации?"
        except Exception as e:
            logger.error(f"Ошибка выполнения инструмента '{tool_name}' для user_id={user_id}: {e}", exc_info=True)
            return "К сожалению, при выполнении вашей команды произошла внутренняя ошибка."
