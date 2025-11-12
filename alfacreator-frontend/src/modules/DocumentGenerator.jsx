// alfacreator-frontend/src/modules/DocumentGenerator.jsx

import React, { useState, useEffect } from 'react';
import { generateDocument } from '../api/apiClient';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// --- ПОЛНАЯ СТРУКТУРА ПОЛЕЙ ДЛЯ ВСЕХ 7 ШАБЛОНОВ ---
const TEMPLATE_FIELDS = {
  invoice: [
    { name: "Номер счета", label: "Номер счета", group: "Общее" },
    { name: "Дата счета", label: "Дата счета", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Основание платежа", label: "Основание платежа", group: "Общее", placeholder: "Договор №456 от 15.11.2025" },
    { name: "Наименование услуги", label: "Наименование товара/услуги", group: "Услуга" },
    { name: "Сумма", label: "Сумма (числом)", group: "Услуга", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Сумма прописью", label: "Сумма прописью", group: "Услуга" },
    { name: "Количество дней на оплату", label: "Кол-во дней на оплату", group: "Условия", placeholder: "5", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Полное наименование Поставщика", label: "Ваше полное наименование (ИП/ООО)", group: "Поставщик (Вы)" },
    { name: "ИНН Поставщика", label: "Ваш ИНН", group: "Поставщик (Вы)", validation: { type: 'inn', message: 'ИНН должен содержать 10 или 12 цифр' } },
    { name: "КПП Поставщика (если есть)", label: "Ваш КПП (если есть)", group: "Поставщик (Вы)" },
    { name: "Юридический адрес Поставщика", label: "Ваш юридический адрес", group: "Поставщик (Вы)" },
    { name: "Расчетный счет Поставщика", label: "Ваш расчетный счет", group: "Поставщик (Вы)", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Наименование банка Поставщика", label: "Наименование вашего банка", group: "Поставщик (Вы)" },
    { name: "Корр. счет банка", label: "Корр. счет вашего банка", group: "Поставщик (Вы)", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "БИК банка", label: "БИК вашего банка", group: "Поставщик (Вы)", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Должность руководителя Поставщика", label: "Ваша должность (или 'ИП')", group: "Поставщик (Вы)" },
    { name: "ФИО руководителя Поставщика", label: "Ваше ФИО", group: "Поставщик (Вы)" },
    { name: "Полное наименование Покупателя", label: "Полное наименование клиента", group: "Покупатель (Клиент)" },
    { name: "ИНН Покупателя", label: "ИНН клиента", group: "Покупатель (Клиент)", validation: { type: 'inn', message: 'ИНН должен содержать 10 или 12 цифр' } },
    { name: "КПП Покупателя (если есть)", label: "КПП клиента (если есть)", group: "Покупатель (Клиент)" },
    { name: "Юридический адрес Покупателя", label: "Юр. адрес клиента", group: "Покупатель (Клиент)" },
  ],
  service_contract: [
    { name: "Номер договора", label: "Номер договора", group: "Общее" },
    { name: "Город", label: "Город", group: "Общее" },
    { name: "Дата договора", label: "Дата договора", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Предмет договора (описание услуг)", label: "Предмет договора (описание услуг)", group: "Общее", type: 'textarea' },
    { name: "Дата начала", label: "Дата начала услуг", group: "Сроки и Оплата", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Дата окончания", label: "Дата окончания услуг", group: "Сроки и Оплата", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Сумма", label: "Сумма договора (числом)", group: "Сроки и Оплата", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Сумма прописью", label: "Сумма прописью", group: "Сроки и Оплата" },
    { name: "Порядок оплаты", label: "Порядок оплаты", group: "Сроки и Оплата" },
    { name: "Полное наименование Исполнителя", label: "Ваше полное наименование", group: "Исполнитель (Вы)" },
    { name: "Должность руководителя Исполнителя", label: "Ваша должность", group: "Исполнитель (Вы)" },
    { name: "ФИО руководителя Исполнителя", label: "Ваше ФИО", group: "Исполнитель (Вы)" },
    { name: "Основание полномочий Исполнителя", label: "Действуете на основании", group: "Исполнитель (Вы)", placeholder: "Устава" },
    { name: "Система налогообложения Исполнителя", label: "Ваша система налогообложения", group: "Исполнитель (Вы)", placeholder: "УСН" },
    { name: "Юридический адрес Исполнителя", label: "Ваш юр. адрес", group: "Исполнитель (Вы)" },
    { name: "ИНН Исполнителя", label: "Ваш ИНН", group: "Исполнитель (Вы)", validation: { type: 'inn', message: 'ИНН должен содержать 10 или 12 цифр' } },
    { name: "КПП Исполнителя", label: "Ваш КПП", group: "Исполнитель (Вы)" },
    { name: "Расчетный счет Исполнителя", label: "Ваш р/с", group: "Исполнитель (Вы)", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Наименование банка Исполнителя", label: "Ваш банк", group: "Исполнитель (Вы)" },
    { name: "Корр. счет банка", label: "Корр. счет", group: "Исполнитель (Вы)", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "БИК банка", label: "БИК", group: "Исполнитель (Вы)", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Полное наименование Заказчика", label: "Полное наименование клиента", group: "Заказчик (Клиент)" },
    { name: "Должность руководителя Заказчика", label: "Должность клиента", group: "Заказчик (Клиент)" },
    { name: "ФИО руководителя Заказчика", label: "ФИО клиента", group: "Заказчик (Клиент)" },
    { name: "Основание полномочий Заказчика", label: "Клиент действует на основании", group: "Заказчик (Клиент)", placeholder: "Устава" },
    { name: "Юридический адрес Заказчика", label: "Юр. адрес клиента", group: "Заказчик (Клиент)" },
    { name: "ИНН Заказчика", label: "ИНН клиента", group: "Заказчик (Клиент)", validation: { type: 'inn', message: 'ИНН должен содержать 10 или 12 цифр' } },
    { name: "КПП Заказчика", label: "КПП клиента", group: "Заказчик (Клиент)" },
  ],
  completion_act: [
    { name: "Номер акта", label: "Номер акта", group: "Общее" },
    { name: "Дата акта", label: "Дата акта", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Город", label: "Город", group: "Общее" },
    { name: "Номер договора", label: "Номер договора (основание)", group: "Общее" },
    { name: "Дата договора", label: "Дата договора (основание)", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Описание выполненных работ в соответствии с договором", label: "Что было сделано (список)", group: "Общее", type: 'textarea' },
    { name: "Сумма", label: "Общая сумма (числом)", group: "Общее", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Сумма прописью", label: "Общая сумма прописью", group: "Общее" },
    { name: "Полное наименование Исполнителя", label: "Ваше полное наименование", group: "Стороны" },
    { name: "Должность руководителя Исполнителя", label: "Ваша должность", group: "Стороны" },
    { name: "ФИО руководителя Исполнителя", label: "Ваше ФИО", group: "Стороны" },
    { name: "Полное наименование Заказчика", label: "Полное наименование клиента", group: "Стороны" },
    { name: "Должность руководителя Заказчика", label: "Должность клиента", group: "Стороны" },
    { name: "ФИО руководителя Заказчика", label: "ФИО клиента", group: "Стороны" },
  ],
  employment_contract: [
    { name: "Номер договора", label: "Номер трудового договора", group: "Общее" },
    { name: "Город", label: "Город", group: "Общее" },
    { name: "Дата договора", label: "Дата заключения договора", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Ваше ИП/ООО", label: "Работодатель", group: "Работодатель (Вы)" },
    { name: "Ваше ФИО", label: "Ваше ФИО (как представителя)", group: "Работодатель (Вы)" },
    { name: "ФИО сотрудника", label: "ФИО сотрудника", group: "Работник" },
    { name: "Паспортные данные сотрудника", label: "Паспортные данные сотрудника", group: "Работник", type: 'textarea' },
    { name: "Должность сотрудника", label: "Должность", group: "Условия" },
    { name: "Адрес места работы", label: "Адрес места работы", group: "Условия" },
    { name: "Срок договора", label: "Срок договора", group: "Условия", placeholder: "бессрочный" },
    { name: "Размер оклада", label: "Размер оклада (числом)", group: "Условия", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Режим работы", label: "Режим работы", group: "Условия", placeholder: "40-часовая рабочая неделя" },
  ],
  supply_contract: [
    { name: "Номер договора", label: "Номер договора", group: "Общее" },
    { name: "Город", label: "Город", group: "Общее" },
    { name: "Дата договора", label: "Дата договора", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Ваше ИП/ООО", label: "Поставщик", group: "Стороны" },
    { name: "Имя клиента", label: "Покупатель", group: "Стороны" },
    { name: "Наименование товара", label: "Наименование товара", group: "Предмет договора", type: 'textarea' },
    { name: "Количество товара", label: "Количество", group: "Предмет договора" },
    { name: "Цена за единицу", label: "Цена за единицу", group: "Предмет договора", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Общая сумма", label: "Общая сумма (числом)", group: "Финансы", validation: { type: 'number', message: 'Введите только цифры' } },
    { name: "Общая сумма прописью", label: "Общая сумма прописью", group: "Финансы" },
    { name: "Порядок оплаты", label: "Порядок оплаты", group: "Финансы" },
    { name: "Срок поставки", label: "Срок поставки", group: "Условия" },
    { name: "Ваше ФИО", label: "ФИО от Поставщика", group: "Подписи" },
    { name: "ФИО клиента", label: "ФИО от Покупателя", group: "Подписи" },
  ],
  memo: [
    { name: "Номер записки", label: "Номер записки", group: "Заголовок" },
    { name: "Дата записки", label: "Дата", group: "Заголовок", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Кому адресовано (должность, ФИО)", label: "Кому (в дательном падеже)", group: "Заголовок" },
    { name: "От кого (должность, ФИО)", label: "От кого (в родительном падеже)", group: "Заголовок" },
    { name: "Тема записки", label: "Тема", group: "Содержание" },
    { name: "Суть просьбы", label: "Суть просьбы", group: "Содержание", type: 'textarea' },
    { name: "Документы-приложения, если есть", label: "Приложения (если есть)", group: "Содержание" },
    { name: "Ваше ФИО", label: "ФИО для подписи", group: "Подпись" },
  ],
  power_of_attorney: [
    { name: "Номер доверенности", label: "Номер доверенности", group: "Общее" },
    { name: "Город", label: "Город", group: "Общее" },
    { name: "Дата выдачи", label: "Дата выдачи", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Срок действия", label: "Доверенность действительна до", group: "Общее", validation: { type: 'date', message: 'Формат ДД.ММ.ГГГГ' } },
    { name: "Ваше ФИО", label: "ФИО доверителя", group: "Доверитель (Вы)" },
    { name: "Ваша должность", label: "Должность доверителя", group: "Доверитель (Вы)" },
    { name: "Ваше ИП/ООО", label: "Организация доверителя", group: "Доверитель (Вы)" },
    { name: "ФИО доверенного лица", label: "ФИО доверенного лица", group: "Доверенное лицо" },
    { name: "Паспортные данные доверенного", label: "Паспортные данные доверенного", group: "Доверенное лицо", type: 'textarea' },
    { name: "Наименование организации-контрагента", label: "От кого получить (организация)", group: "Суть доверенности" },
    { name: "Список ТМЦ", label: "Что получить (список)", group: "Суть доверенности", type: 'textarea' },
  ],
};

const validateForm = (fields, formData) => {
  const newErrors = {};
  fields.forEach(field => {
    const value = formData[field.name];
    if (field.validation) {
      const rule = field.validation;
      let error = null;

      if (!value) return;

      switch(rule.type) {
        case 'number':
          if (!/^\d+(\.\d+)?$/.test(value)) error = rule.message; // Allow decimals
          break;
        case 'date':
          if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) error = rule.message;
          break;
        case 'inn':
          if (!/^\d{10}$/.test(value) && !/^\d{12}$/.test(value)) error = rule.message;
          break;
        default:
          break;
      }
      if (error) {
        newErrors[field.name] = error;
      }
    }
  });
  return newErrors;
};

const DocumentGenerator = (props) => {
  const [template, setTemplate] = useState('invoice');
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({});
    setErrors({});
  }, [template]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm(TEMPLATE_FIELDS[template] || [], formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Пожалуйста, исправьте ошибки в форме.');
      return;
    }

    setIsLoading(true);
    setResult('');
    setErrors({});

    try {
      const response = await generateDocument({ template_name: template, details: formData });
      setResult(response.data.generated_text);
      toast.success('Документ успешно сгенерирован!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка генерации документа.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success('Текст скопирован!');
  };

  const handleDownloadDocx = () => {
    if (!result) return;
    const paragraphs = result.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }));
    const doc = new Document({ sections: [{ children: paragraphs }] });
    Packer.toBlob(doc).then(blob => saveAs(blob, `${template}.docx`));
  };

  const currentFields = TEMPLATE_FIELDS[template] || [];
  const groupedFields = currentFields.reduce((acc, field) => {
    const group = field.group || 'Основные данные';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Генератор документов</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Выберите шаблон</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="invoice">Счет на оплату (профессиональный)</option>
            <option value="service_contract">Договор оказания услуг (профессиональный)</option>
            <option value="completion_act">Акт выполненных работ (профессиональный)</option>
            <option value="employment_contract">Трудовой договор (упрощенный)</option>
            <option value="supply_contract">Договор поставки</option>
            <option value="memo">Служебная записка</option>
            <option value="power_of_attorney">Доверенность</option>
          </select>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedFields).map(([groupName, fields]) => (
            <div key={groupName} className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{groupName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(field => {
                  const isError = !!errors[field.name];
                  const InputComponent = field.type === 'textarea' ? 'textarea' : 'input';
                  return (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                      <InputComponent
                        type="text"
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        className={`mt-1 block w-full rounded-md shadow-sm ${
                          isError
                            ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                        }`}
                        placeholder={field.placeholder || field.label}
                      />
                      {isError && <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Генерация...' : 'Сгенерировать документ'}
        </button>
      </form>

      {isLoading && <div className="mt-6"><Loader text="ИИ заполняет документ..." /></div>}

      {result && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">Готовый документ:</h3>
            <div className="flex space-x-2">
              <button onClick={copyToClipboard} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg">
                Копировать текст
              </button>
              <button onClick={handleDownloadDocx} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg">
                Скачать .docx
              </button>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGenerator;