#Запускается отдельно при необходимости распарсить файл
# alfacreator-backend/prepare_db.py
import os
import json
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
import docx
import pypdf
import chromadb

# --- НОВЫЕ ФУНКЦИИ-ПАРСЕРЫ ---

def parse_pdf(file_path: str) -> str:
    """Извлекает текст из PDF файла."""
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Ошибка при чтении PDF {file_path}: {e}")
        return ""


def parse_docx(file_path: str) -> str:
    """Извлекает текст из DOCX файла."""
    try:
        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        print(f"Ошибка при чте-нии DOCX {file_path}: {e}")
        return ""


def parse_json_smm(file_path: str) -> list:
    """Парсит JSON файл с курсами SMM (как раньше)."""
    docs = []
    with open(file_path, "r", encoding="utf-8") as f:
        courses = json.load(f)
        for course_name, data in courses.items():
            if "glossary" in data:
                for term, definition in data["glossary"].items():
                    docs.append(
                        {"text": f"Термин: {term}. Определение: {definition}", "source": os.path.basename(file_path)})
            if "modules" in data:
                for module in data["modules"]:
                    for lesson in module["lessons"]:
                        docs.append({
                                        "text": f"Урок '{lesson['lesson_title']}' из курса '{course_name}': {lesson['lesson_text']}",
                                        "source": os.path.basename(file_path)})
    return docs


# --------------------------------

def load_and_chunk_docs(folder_path: str) -> list:
    """
    Сканирует папку, парсит все файлы и разбивает текст на чанки.
    """
    raw_docs = []
    print(f"Сканирование папки '{folder_path}'...")
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if not os.path.isfile(file_path):
            continue

        print(f"  - Обработка файла: {filename}")
        if filename.endswith(".pdf"):
            text = parse_pdf(file_path)
            if text:
                raw_docs.append({"text": text, "source": filename})
        elif filename.endswith(".docx"):
            text = parse_docx(file_path)
            if text:
                raw_docs.append({"text": text, "source": filename})
        elif filename.endswith(".json"):
            # Предполагаем, что JSON-файлы имеют сложную структуру, как наши курсы
            # и их парсер возвращает уже готовые небольшие документы
            parsed_json_docs = parse_json_smm(file_path)
            raw_docs.extend(parsed_json_docs)
        else:
            print(f"    - Пропущен неподдерживаемый формат: {filename}")

    # --- ЧАНКИНГ (РАЗБИЕНИЕ НА КУСОЧКИ) ---
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,  # Размер чанка в символах
        chunk_overlap=100,  # Перекрытие между чанками
        length_function=len,
    )

    final_docs = []
    for doc in raw_docs:
        # JSON-документы уже маленькие, их не нужно разбивать
        if ".json" in doc["source"]:
            final_docs.append(doc)
        else:
            # А вот текст из PDF и DOCX разбиваем
            chunks = text_splitter.split_text(doc["text"])
            for chunk in chunks:
                final_docs.append({"text": chunk, "source": doc["source"]})

    return final_docs


def main():
    knowledge_base_path = "./knowledge_base"

    print("Этап 1: Загрузка и обработка документов...")
    documents = load_and_chunk_docs(knowledge_base_path)
    if not documents:
        print("Не найдено документов для обработки. Завершение.")
        return

    print(f"\nЭтап 2: Загрузка embedding-модели (может занять время при первом запуске)...")
    embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

    print("\nЭтап 3: Создание векторов для чанков...")
    embeddings = embedding_model.encode([doc["text"] for doc in documents], show_progress_bar=True)

    print("\nЭтап 4: Сохранение данных в ChromaDB...")
    # Используем PersistentClient для сохранения БД на диск
    chroma_client = chromadb.PersistentClient(path="./chroma_db")

    collection_name = "smm_assistant_kb"
    # Удаляем старую коллекцию, если она есть, для полного обновления
    if collection_name in [c.name for c in chroma_client.list_collections()]:
        print(f"Удаление старой коллекции '{collection_name}'...")
        chroma_client.delete_collection(name=collection_name)

    print(f"Создание новой коллекции '{collection_name}'...")
    collection = chroma_client.create_collection(name=collection_name)

    collection.add(
        embeddings=embeddings,
        documents=[doc["text"] for doc in documents],
        metadatas=[{"source": doc["source"]} for doc in documents],
        ids=[str(i) for i in range(len(documents))]
    )

    print(f"\nГотово! Векторная база '{collection_name}' создана/обновлена.")
    print(f"Всего обработано и добавлено чанков: {len(documents)}")


if __name__ == "__main__":
    main()