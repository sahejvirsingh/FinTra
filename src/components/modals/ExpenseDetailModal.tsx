
import React from 'react';
import { X, Calendar, Clock, Tag, Wallet, Edit, Trash2 } from 'lucide-react';
import { Expense, Account, ExpenseItem } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ExpenseDetailModalProps {
  expense: Expense;
  account: Account | undefined;
  currency: string;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onViewItemHistory?: (item: ExpenseItem) => void;
}

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined | null }) => (
    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
        <div className="w-6 mr-3 text-gray-400">{icon}</div>
        <span className="font-semibold w-20">{label}:</span>
        <span className="text-gray-800 dark:text-gray-100">{value || 'N/A'}</span>
    </div>
);

const ExpenseDetailModal = ({ expense, account, currency, onClose, onEdit, onDelete, onViewItemHistory }: ExpenseDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{expense.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Expense Details</p>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Total Amount</span>
                <span className="text-3xl font-bold text-red-500 dark:text-red-400">-{formatCurrency(expense.amount, currency)}</span>
            </div>

            <div className="space-y-3">
                <DetailRow icon={<Calendar size={16} />} label="Date" value={new Date(expense.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
                <DetailRow icon={<Clock size={16} />} label="Time" value={expense.time} />
                <DetailRow icon={<Tag size={16} />} label="Category" value={expense.category} />
                <DetailRow icon={<Wallet size={16} />} label="Account" value={account?.name} />
            </div>

            {expense.description && (
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">{expense.description}</p>
                </div>
            )}
          
            {expense.expense_items && expense.expense_items.length > 0 && (
                 <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Itemized List</h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="text-left font-medium p-3">Item</th>
                                    <th className="text-center font-medium p-3 w-16">Qty</th>
                                    <th className="text-right font-medium p-3 w-28">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {expense.expense_items.map(item => (
                                <tr
                                  key={item.id}
                                  onClick={() => onViewItemHistory?.(item)}
                                  className={onViewItemHistory ? 'cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                                >
                                    <td className="p-3 text-gray-800 dark:text-gray-200">{item.name}</td>
                                    <td className="p-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                    <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.price, currency)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button onClick={() => onDelete(expense)} className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2">
            <Trash2 size={16} /> Delete
          </button>
          <button onClick={() => onEdit(expense)} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors ml-4 flex items-center gap-2">
            <Edit size={16} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;
