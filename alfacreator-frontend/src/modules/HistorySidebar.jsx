import React, { useState, useEffect } from 'react';
import { getHistory } from '../api/apiClient';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const PromoHistoryItem = ({ item }) => (
  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
    {item.output_data.results.slice(0, 2).map((text, i) => (
      <li key={i} className="truncate" title={text}>{text}</li>
    ))}
  </ul>
);

const AnalyticsHistoryItem = ({ item }) => (
  <p className="text-sm text-gray-700 truncate" title={item.output_data.insights}>
    {item.output_data.insights}
  </p>
);

const DocumentHistoryItem = ({ item }) => (
    <>
      <p className="text-sm font-medium text-gray-500">Шаблон: {item.input_data.template_name}</p>
      <p className="text-sm text-gray-700 truncate" title={item.output_data.generated_text}>
        {item.output_data.generated_text.substring(0, 100)}...
      </p>
    </>
);

const SmartAnalyticsHistoryItem = ({ item }) => (
    <>
        <p className="text-sm font-medium text-gray-500">
            {item.input_data.link || item.input_data.filename || 'Запрос'}
        </p>
        <p className="text-sm text-gray-700 truncate" title={item.output_data.celNaNedelyu}>
            Цель: {item.output_data.celNaNedelyu}
        </p>
    </>
);


const HistorySidebar = ({ type, refreshKey, onItemClick }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await getHistory(type);
        setHistory(response.data);
      } catch (error) {
        toast.error(`Не удалось загрузить историю для '${type}'`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [type, refreshKey]);

  const renderItem = (item) => {
    switch (item.request_type) {
      case 'promo': return <PromoHistoryItem item={item} />;
      case 'analytics': return <AnalyticsHistoryItem item={item} />;
      case 'document': return <DocumentHistoryItem item={item} />;
      case 'smart_analytics': return <SmartAnalyticsHistoryItem item={item} />;
      default: return null;
    }
  };

  return (
    <div className="w-full lg:w-1/3 lg:pl-8 mt-8 lg:mt-0">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Последние запросы</h3>
      {isLoading ? (
        <Loader text="Загрузка истории..." />
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md hover:border-red-300 transition-all cursor-pointer"
              onClick={() => onItemClick(item)}
            >
              <span className="text-xs text-gray-400 float-right">{new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-8 p-4 border-dashed border-2 rounded-lg">
          <p>История для этого раздела пуста.</p>
        </div>
      )}
    </div>
  );
};

export default HistorySidebar;
