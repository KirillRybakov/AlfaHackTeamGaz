import React, { useState } from 'react';
import { generatePromo } from '../api/apiClient';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const PromoGenerator = () => {
  const [formData, setFormData] = useState({
    product_description: '',
    audience: '',
    tone: '',
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await generatePromo(formData);
      setResults(response.data.results);
      toast.success('Промо-материалы успешно сгенерированы!');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Не удалось сгенерировать промо.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Текст скопирован!');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Генератор промо-материалов</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Описание продукта</label>
          <textarea
            name="product_description"
            value={formData.product_description}
            onChange={handleChange}
            required
            minLength="10"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            rows="3"
            placeholder="Например, свежеобжаренный кофе из Бразилии с нотками шоколада"
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Целевая аудитория</label>
          <input
            type="text"
            name="audience"
            value={formData.audience}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="Например, студенты или офисные работники"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Тональность</label>
          <input
            type="text"
            name="tone"
            value={formData.tone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            placeholder="Например, дружелюбная, энергичная или деловая"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
        >
          {isLoading ? 'Генерация...' : 'Сгенерировать'}
        </button>
      </form>

      {isLoading && <div className="mt-6"><Loader text="ИИ думает..." /></div>}
      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold">Результаты:</h3>
          {results.map((text, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md border relative">
              <p className="text-gray-800">{text}</p>
              <button onClick={() => copyToClipboard(text)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 100 2h4a1 1 0 100-2H5z" />
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoGenerator;