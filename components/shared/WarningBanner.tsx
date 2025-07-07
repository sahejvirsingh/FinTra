

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface WarningBannerProps {
  message: string;
  onDismiss: () => void;
}

const WarningBanner = ({ message, onDismiss }: WarningBannerProps) => {
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg relative mb-4 flex items-center text-sm animate-in fade-in-0">
      <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-grow">{message}</span>
      <button onClick={onDismiss} className="ml-4 p-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WarningBanner;