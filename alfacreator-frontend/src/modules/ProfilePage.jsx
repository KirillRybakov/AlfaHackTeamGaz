// src/modules/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, changeUserPassword } from '../api/apiClient';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    
    // Состояние для формы информации о профиле
    const [formData, setFormData] = useState({
        full_name: '',
        company_name: '',
        job_title: ''
    });
    const [infoLoading, setInfoLoading] = useState(false);

    // Состояние для формы смены пароля
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Синхронизируем состояние формы с данными пользователя при загрузке
    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                company_name: user.company_name || '',
                job_title: user.job_title || ''
            });
        }
    }, [user]);
    
    // Обработчики для полей
    const handleInfoChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    // Обработчик отправки формы профиля
    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setInfoLoading(true);
        try {
            const { data } = await updateUserProfile(formData);
            updateUser(data);
            toast.success('Профиль успешно обновлен!');
        } catch (error) {
            toast.error('Не удалось обновить профиль.');
        } finally {
            setInfoLoading(false);
        }
    };
    
    // Обработчик отправки формы смены пароля
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Новые пароли не совпадают.');
            return;
        }
        setPasswordLoading(true);
        try {
            const { current_password, new_password } = passwordData;
            await changeUserPassword({ current_password, new_password });
            toast.success('Пароль успешно изменен!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Не удалось изменить пароль. Проверьте текущий пароль.');
        } finally {
            setPasswordLoading(false);
        }
    };
    
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        {/* --- Форма обновления профиля --- */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Профиль пользователя</h2>
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (нельзя изменить)</label>
              <input type="email" value={user?.email || ''} readOnly className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Полное имя</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="Иванов Иван Иванович" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Название компании</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={handleInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="ООО 'Ромашка'" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Должность</label>
              <input type="text" name="job_title" value={formData.job_title} onChange={handleInfoChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="Генеральный директор" />
            </div>
            <button type="submit" disabled={infoLoading} className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400">
              {infoLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>

        {/* --- ВОССТАНОВЛЕННАЯ ФОРМА СМЕНЫ ПАРОЛЯ --- */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Смена пароля</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Текущий пароль</label>
              <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
              <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Подтвердите новый пароль</label>
              <input type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <button type="submit" disabled={passwordLoading} className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 disabled:bg-gray-400">
              {passwordLoading ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>
      </div>
    );
};

export default ProfilePage;