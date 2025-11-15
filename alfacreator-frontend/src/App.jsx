import React from 'react';
// 1. Импортируем компоненты для роутинга
import { Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// 2. Импортируем главные компоненты и страницы
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './modules/LoginPage';
import RegisterPage from './modules/RegisterPage';
import PromoGenerator from './modules/PromoGenerator';
import AnalyticsDashboard from './modules/AnalyticsDashboard';
import DocumentGenerator from './modules/DocumentGenerator';
import SmartAnalytics from './modules/SmartAnalytics';
import ChatWidget from './modules/ChatWidget'; // Импортировано из ветки test

// 3. Создаем компонент-обертку для страниц с общей навигацией
const AppLayout = () => {
  // Функция для стилизации активной кнопки-ссылки
  const navButtonClasses = ({ isActive }) =>
    `px-4 py-2 font-semibold rounded-md transition-colors ${
      isActive 
        ? 'bg-red-600 text-white shadow-md' 
        : 'text-gray-600 hover:bg-red-100'
    }`;

  return (
    <main className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-wrap justify-center gap-2 md:gap-4">
        {/* Используем NavLink вместо button для навигации */}
        <NavLink to="/promo" className={navButtonClasses}>
          Генератор Промо
        </NavLink>
        <NavLink to="/analytics" className={navButtonClasses}>
          Аналитика CSV
        </NavLink>
        <NavLink to="/documents" className={navButtonClasses}>
          Шаблоны
        </NavLink>
        <NavLink to="/smart-analytics" className={navButtonClasses}>
          Умная Аналитика
        </NavLink>
      </div>
      
      {/* Outlet - это место, куда react-router будет рендерить дочерний роут */}
      <Outlet />
    </main>
  );
};

// 4. Собираем все роуты в главном компоненте App
function App() {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <Routes>
        {/* Публичные роуты, доступные всем */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Группа защищенных роутов, которые используют общую навигацию (AppLayout) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* При заходе на / будет автоматический редирект на /promo */}
          <Route index element={<Navigate to="/promo" replace />} /> 
          
          {/* Определяем, какой компонент показывать для каждого пути */}
          <Route path="promo" element={<PromoGenerator />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="documents" element={<DocumentGenerator />} />
          <Route path="smart-analytics" element={<SmartAnalytics />} />
        </Route>

        {/* Запасной роут для всех остальных URL */}
        <Route path="*" element={
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-gray-600">Страница не найдена</p>
          </div>
        } />
      </Routes>
      <ChatWidget /> {/* Компонент чата добавлен из ветки test */}
    </div>
  );
}

export default App;