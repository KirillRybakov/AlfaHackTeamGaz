import React from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Импортируем хук

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Перенаправляем на страницу входа после выхода
  };

  const navLinkClasses = "font-semibold hover:text-red-200 transition-colors";
  const activeNavLinkClasses = "text-white underline"; // Стиль для активной ссылки, если хотите

  return (
    <header className="bg-red-600 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <Link to="/" className="text-2xl font-bold">Альфа-Креатор</Link>
          <p className="text-sm">Ваш ИИ-помощник для малого бизнеса</p>
        </div>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:block">Привет, {user?.email}!</span>

              {/* ▼▼▼ ДОБАВЛЯЕМ ССЫЛКУ НА ПРОФИЛЬ ▼▼▼ */}
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : 'text-red-100'}`}
              >
                Профиль
              </NavLink>

              <button
                onClick={handleLogout}
                className="bg-white text-red-600 px-4 py-2 rounded-md font-semibold hover:bg-red-100 transition"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-semibold hover:text-red-200">
                Войти
              </Link>
              <Link to="/register" className="bg-white text-red-600 px-4 py-2 rounded-md font-semibold hover:bg-red-100 transition">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;