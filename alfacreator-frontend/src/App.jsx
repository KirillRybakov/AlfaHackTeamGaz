// alfacreator-frontend/src/App.jsx

import React, { useState } from 'react';
import Header from './components/Header';
import PromoGenerator from './modules/PromoGenerator';
import AnalyticsDashboard from './modules/AnalyticsDashboard';
import DocumentGenerator from './modules/DocumentGenerator';
import SmartAnalytics from './modules/SmartAnalytics';
import { Toaster } from 'react-hot-toast';
import ChatWidget from './modules/ChatWidget';
function App() {
  // Убедимся, что начальное состояние соответствует одной из кнопок
  const [activeTab, setActiveTab] = useState('promo');

  const navButtonClasses = (tabName) =>
    `px-4 py-2 font-semibold rounded-md transition-colors ${
      activeTab === tabName 
        ? 'bg-red-600 text-white' 
        : 'text-gray-600 hover:bg-red-100'
    }`;

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-wrap justify-center gap-2 md:gap-4">

          {/* Проверяем все имена в onClick */}
          <button onClick={() => setActiveTab('promo')} className={navButtonClasses('promo')}>
            Генератор Промо
          </button>

          <button onClick={() => setActiveTab('analytics')} className={navButtonClasses('analytics')}>
            Аналитика CSV
          </button>

          <button onClick={() => setActiveTab('documents')} className={navButtonClasses('documents')}>
            Шаблоны
          </button>

          <button onClick={() => setActiveTab('smart_analytics')} className={navButtonClasses('smart_analytics')}>
            Умная Аналитика
          </button>
        </div>
        <div className="max-w-6xl mx-auto">

          {/* Проверяем все условия рендеринга */}
          {activeTab === 'promo' && <PromoGenerator />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'documents' && <DocumentGenerator />}
          {activeTab === 'smart_analytics' && <SmartAnalytics />}

        </div>
      </main>
      <ChatWidget />
    </div>
  );
}

export default App;