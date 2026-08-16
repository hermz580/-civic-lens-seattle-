
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
      <p className="text-lg">Searching for recent reports...</p>
    </div>
  );
};

export default LoadingSpinner;
