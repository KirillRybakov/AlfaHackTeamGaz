// alfacreator-frontend/src/modules/ChatWidget.jsx

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Paperclip } from 'lucide-react';
import { sendChatMessage } from '../api/apiClient';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

// Анимация печатания
const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-3">
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
  </div>
);

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // Реф для сброса значения инпута файла

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`Файл ${selectedFile.name} прикреплен.`);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Сбрасываем значение инпута
    }
  }

  const handleSend = async () => {
    if (!input.trim() && !file) return;

    const userMessageText = input + (file ? `\n\n*Прикреплен файл: ${file.name}*` : '');
    const userMessage = { sender: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    removeFile(); // Используем нашу функцию для сброса файла
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', input);
      if (file) {
        formData.append('file', file);
      }

      const response = await sendChatMessage(formData);
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ошибка ответа ассистента.");
      const errorMessage = { sender: 'bot', text: 'К сожалению, произошла ошибка. Попробуйте еще раз.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* --- ОБНОВЛЕННАЯ ПЛАВАЮЩАЯ КНОПКА-ТРИГГЕР --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-transform transform hover:scale-110 z-50"
        aria-label={isOpen ? "Закрыть чат" : "Открыть чат"}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* --- ОБНОВЛЕННОЕ ОКНО ЧАТА С АДАПТИВНЫМИ РАЗМЕРАМИ --- */}
      <div
        className={`fixed bottom-24 right-5 bg-white rounded-xl shadow-2xl flex flex-col transition-all duration-300 
                    w-[90vw] max-w-md h-[70vh] max-h-[600px] 
                    resize-y overflow-auto ${ // <-- ДОБАВЛЯЕМ RESIZE-Y (изменение размера по вертикали)
                    isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <header className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-xl cursor-move flex-shrink-0">
          <h3 className="font-bold">SMM Ассистент</h3>
          <button onClick={() => setIsOpen(false)}><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[85%] break-words ${msg.sender === 'user' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <ReactMarkdown components={{ p: ({children}) => <p className="mb-0">{children}</p> }}>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end justify-start">
              <div className="p-3 rounded-2xl bg-gray-200">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 border-t bg-white flex-shrink-0">
          {file && (
            <div className="text-xs text-gray-500 mb-2 flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>Прикреплен: {file.name}</span>
              <button onClick={removeFile} className="text-red-500 hover:text-red-700"><X size={16}/></button>
            </div>
          )}
          <div className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 p-2 border rounded-l-md focus:ring-red-500 focus:border-red-500"
              placeholder="Спросите что-нибудь..."
            />
            <label htmlFor="file-upload" className="p-3 border-t border-b cursor-pointer hover:bg-gray-100">
              <Paperclip size={20} className="text-gray-500" />
            </label>
            <input id="file-upload" type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button onClick={handleSend} disabled={isLoading} className="bg-red-600 text-white px-4 py-3 rounded-r-md hover:bg-red-700 disabled:bg-gray-400">
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatWidget;