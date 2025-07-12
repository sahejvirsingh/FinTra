
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface WarningBannerProps {
  message: string;
  onDismiss: () => void;
}

const WarningBanner = ({ message, onDismiss }: WarningBannerProps) => {
  return (
    <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg relative mb-4 flex items-center text-sm animate-in fade-in-0">
      <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-grow">{message}</span>
      <button onClick={onDismiss} className="ml-4 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WarningBanner;