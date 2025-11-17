import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { uploadAnalyticsFile, getAnalyticsResult } from '../api/apiClient';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import HistorySidebar from './HistorySidebar';

const AnalyticsDashboard = () => {
  const [status, setStatus] = useState('idle');
  const [taskId, setTaskId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [refreshHistory, setRefreshHistory] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const acceptedFile = acceptedFiles[0];
      if (acceptedFile.type !== 'text/csv') {
        toast.error('Пожалуйста, загрузите файл в формате CSV.');
        return;
      }
      handleUpload(acceptedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleUpload = async (fileToUpload) => {
    setStatus('uploading');
    setError('');
    setResult(null);
    try {
      const response = await uploadAnalyticsFile(fileToUpload);
      setTaskId(response.data.task_id);
      setStatus('processing');
      toast.success('Файл успешно загружен, начинаем анализ...');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Ошибка загрузки файла.';
      setError(errorMessage);
      setStatus('error');
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    let intervalId;
    if (status === 'processing' && taskId) {
      intervalId = setInterval(async () => {
        try {
          const response = await getAnalyticsResult(taskId);
          const task = response.data;
          if (task.status === 'complete') {
            setResult(task.result);
            setStatus('success');
            toast.success('Анализ завершен!');
            setRefreshHistory(key => key + 1);
            clearInterval(intervalId);
          } else if (task.status === 'error') {
            setError(task.result?.error_message || 'Произошла ошибка при анализе файла.');
            setStatus('error');
            toast.error('Ошибка анализа файла.');
            clearInterval(intervalId);
          }
        } catch (err) {
          setError('Не удалось получить результат анализа.');
          setStatus('error');
          clearInterval(intervalId);
        }
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [status, taskId]);

  const handleHistoryItemClick = (historyItem) => {
    setResult(historyItem.output_data);
    setStatus('success');
    toast.success("Результат из истории загружен!");
  };

  const renderContent = () => {
    switch (status) {
      case 'uploading':
        return <div className="text-center py-10"><Loader text="Загрузка файла..." /></div>;
      case 'processing':
        return <div className="text-center py-10"><Loader text="Анализируем данные... Это может занять время." /></div>;
      case 'success':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Выводы и рекомендации ИИ:</h3>
              <div className="mt-2 bg-green-50 p-4 rounded-md border border-green-200">
                <p className="text-gray-700 whitespace-pre-wrap">{result.insights}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">График продаж:</h3>
              <div style={{ width: '100%', height: 300 }} className="mt-2">
                <ResponsiveContainer>
                  <LineChart data={result.chart_data.labels.map((label, index) => ({ name: label, value: result.chart_data.values[index] }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} name="Продажи" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'error':
        return <p className="text-red-600 text-center py-10">{error}</p>;
      case 'idle':
      default:
        return (
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-red-500 transition-colors">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-gray-600">Отпустите, чтобы загрузить...</p>
            ) : (
              <p className="text-gray-600">Перетащите CSV файл сюда или кликните для выбора</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-2/3">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Аналитика продаж</h2>
          {renderContent()}
        </div>
      </div>
      <HistorySidebar type="analytics" refreshKey={refreshHistory} onItemClick={handleHistoryItemClick} />
    </div>
  );
};

export default AnalyticsDashboard;
