// alfacreator-frontend/src/modules/ChatInterface.jsx
import React, { useState } from 'react';
import { sendChatMessage } from '../api/apiClient';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(input);
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      toast.error("Ошибка ответа ассистента.");
      const errorMessage = { sender: 'bot', text: 'К сожалению, произошла ошибка.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">SMM Ассистент</h2>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-gray-200 text-gray-500">Ассистент печатает...</div>
          </div>
        )}
      </div>
      <div className="mt-4 flex">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 p-2 border rounded-l-md focus:ring-red-500 focus:border-red-500"
          placeholder="Спросите что-нибудь или вставьте данные для анализа..."
          rows="2"
        />
        <button onClick={handleSend} disabled={isLoading} className="bg-red-600 text-white px-6 rounded-r-md hover:bg-red-700 disabled:bg-gray-400">
          Отправить
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;