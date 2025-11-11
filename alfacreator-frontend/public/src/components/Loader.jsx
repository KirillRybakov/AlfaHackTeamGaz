import React from 'react';

const Loader = ({ text = "Загрузка..." }) => (
  <div className="flex flex-col items-center justify-center space-y-2">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    <p className="text-gray-600">{text}</p>
  </div>
);

export default Loader;