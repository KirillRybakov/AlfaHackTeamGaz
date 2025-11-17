import React from 'react';
import { Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuth } from './contexts/AuthContext'; 

import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './modules/LoginPage';
import RegisterPage from './modules/RegisterPage';
import PromoGenerator from './modules/PromoGenerator';
import AnalyticsDashboard from './modules/AnalyticsDashboard';
import DocumentGenerator from './modules/DocumentGenerator';
import SmartAnalytics from './modules/SmartAnalytics';
import ChatWidget from './modules/ChatWidget';
import ProfilePage from './modules/ProfilePage';

const AppLayout = () => {
  const navButtonClasses = ({ isActive }) =>
    `px-4 py-2 font-semibold rounded-md transition-colors ${
      isActive ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-red-100'
    }`;
    
  return (
    <main className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-wrap justify-center gap-2 md:gap-4">
        <NavLink to="/promo" className={navButtonClasses}>Генератор Промо</NavLink>
        
        <NavLink to="/analytics" className={navButtonClasses}>Аналитика CSV</NavLink>

        <NavLink to="/documents" className={navButtonClasses}>Шаблоны</NavLink>
        <NavLink to="/smart-analytics" className={navButtonClasses}>Умная Аналитика</NavLink>
      </div>
      <Outlet />
    </main>
  );
};

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <Routes>
        {/* Публичные роуты */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Защищенные роуты */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/promo" replace />} /> 
          <Route path="promo" element={<PromoGenerator />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="documents" element={<DocumentGenerator />} />
          <Route path="smart-analytics" element={<SmartAnalytics />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-gray-600">Страница не найдена</p>
          </div>
        } />
      </Routes>
      
      {isAuthenticated && user && (
        <ChatWidget 
          key={user.id} 
        />
      )}
    </div>
  );
}

export default App;
