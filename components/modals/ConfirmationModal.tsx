

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirming = false,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
        <div className="p-6">
            <div className="flex items-start space-x-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">
                        {title}
                    </h2>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                           {message}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button onClick={onClose} disabled={isConfirming} className="px-6 py-2 text-sm font-semibold text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {cancelText}
          </button>
          <button onClick={onConfirm} type="button" disabled={isConfirming} className="px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:ring-offset-gray-800 transition-colors ml-4 w-32 h-[38px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isConfirming ? <Loader2 size={20} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;