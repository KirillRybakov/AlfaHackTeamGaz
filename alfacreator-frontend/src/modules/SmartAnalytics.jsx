// alfacreator-frontend/src/modules/SmartAnalytics.jsx

import React, { useState } from 'react';
// Убедись, что функция импортируется правильно
import { runSmartAnalysis } from '../api/apiClient';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import HistorySidebar from './HistorySidebar';

const SmartAnalytics = () => {
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleAnalyze = async () => {
    if (!link && !file) {
      toast.error('Добавьте ссылку или загрузите файл с данными.');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (link) {
        formData.append('link', link);
      }

      // Используем правильное имя функции
      const response = await runSmartAnalysis(formData);

      setResult(response.data);
      toast.success("Анализ успешно завершен!");
      setRefreshHistory(key => key + 1);
    } catch (err) {
      console.error('Ошибка при анализе:', err);
      const errorMessage = err.response?.data?.detail || 'Не удалось выполнить анализ. Проверьте консоль браузера (F12).';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemClick = (historyItem) => {
    setResult(historyItem.output_data);
    const input = historyItem.input_data;
    setLink(input.link || '');
    setFile(null);
    toast.success("Результат из истории загружен!");
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-2/3">
        <div className="p-6 bg-white rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">🧠 Умная аналитика</h1>
          <p className="text-gray-600 mb-6 text-center">
            Загрузите данные или укажите ссылку на соцсеть для получения контент-плана.
          </p>

          <div className="space-y-4">
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Ссылка на Telegram/VK/Instagram"
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
            />
            <div>
              <label className="block mb-2 text-sm text-gray-600">Загрузить файл с данными (.csv, .xlsx)</label>
              <input
                type="file"
                onClick={(e) => (e.target.value = null)}
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition disabled:bg-gray-400 w-full"
            >
              {loading ? 'Анализирую...' : 'Запустить анализ'}
            </button>
          </div>

          {loading && <div className="text-center mt-4"><Loader /></div>}
          {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

          {result && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Результаты анализа</h2>
              {result.kratkieRekomendatsii && (
                  <div className="mb-6">
                      <h3 className="font-semibold text-gray-700 mb-2">💡 Ключевые рекомендации:</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {result.kratkieRekomendatsii.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                  </div>
              )}
              {result.celNaNedelyu && (
                  <div className="mb-6 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">🎯 Цель на неделю:</h3>
                      <p className="text-gray-700">{result.celNaNedelyu}</p>
                  </div>
              )}
              {result.kontentPlan && (
                  <div>
                      <h3 className="font-semibold text-gray-800 mb-3">🗓️ Контент-план по дням:</h3>
                      <div className="space-y-4">
                          {result.kontentPlan.map((plan, index) => (
                              <div key={index} className="border border-gray-200 p-4 rounded-lg">
                                  <p className="font-bold text-md text-red-600">{plan.den}</p>
                                  <p className="mt-2"><strong>Тема:</strong> {plan.tema}</p>
                                  <p className="mt-1"><strong>Идея поста:</strong> {plan.ideyaPosta}</p>
                                  <p className="mt-1"><strong>Формат:</strong> {plan.format}</p>
                                  <p className="mt-1"><strong>Призыв к действию:</strong> {plan.prizyvKDeystviyu}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
      <HistorySidebar type="smart_analytics" refreshKey={refreshHistory} onItemClick={handleHistoryItemClick}/>
    </div>
  );
};

export default SmartAnalytics;
