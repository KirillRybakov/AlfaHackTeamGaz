// alfacreator-frontend/src/App.jsx

import React, { useState } from 'react';
import Header from './components/Header';
import PromoGenerator from './modules/PromoGenerator';
import AnalyticsDashboard from './modules/AnalyticsDashboard';
import DocumentGenerator from './modules/DocumentGenerator';
import { Toaster } from 'react-hot-toast';
import SmartCalendar from './modules/SmartCalendar';

function App() {
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
        <div className="mb-6 flex justify-center space-x-2 md:space-x-4">
          <button onClick={() => setActiveTab('promo')} className={navButtonClasses('promo')}>
            Генератор Промо
          </button>
          <button onClick={() => setActiveTab('analytics')} className={navButtonClasses('analytics')}>
            Аналитика
          </button>
          <button onClick={() => setActiveTab('documents')} className={navButtonClasses('documents')}>
            Шаблоны
          </button>
          <button onClick={() => setActiveTab('calendar')} className={navButtonClasses('calendar')}>
            Умный календарь
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          {activeTab === 'promo' && <PromoGenerator />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'documents' && <DocumentGenerator />}
          {activeTab === 'calendar' && <SmartCalendar />}
        </div>
      </main>
    </div>
  );
}

export default App;