

import React from 'react';
import { Plus } from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency } from '../utils/currency';

interface RecentExpensesProps {
  onAddExpenseClick: () => void;
  expenses: Expense[];
  currency: string;
  onViewAllClick: () => void;
  onViewExpense: (expense: Expense) => void;
}

const RecentExpenses = ({ onAddExpenseClick, expenses, currency, onViewAllClick, onViewExpense }: RecentExpensesProps) => {
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h2>
        <button onClick={onViewAllClick} className="text-sm font-semibold text-indigo-500 hover:underline">
          View All
        </button>
      </div>
      
      <button onClick={onAddExpenseClick} className="w-full flex items-center justify-center py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all mb-4">
        <Plus size={18} className="mr-2" />
        <span className="font-semibold text-sm">Add New Expense</span>
      </button>

      <div className="space-y-3">
        {expenses.length > 0 ? (
          expenses.slice(0, 4).map((expense) => (
            <button key={expense.id} onClick={() => onViewExpense(expense)} className="w-full flex items-center justify-between text-left p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center">
                <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <span className="text-lg">🛍️</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-white">{expense.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</p>
                </div>
              </div>
               <p className="font-semibold text-red-500 dark:text-red-400 w-24 text-right">-{formatCurrency(expense.amount, currency)}</p>
            </button>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-500 py-4">No recent expenses.</p>
        )}
      </div>
    </div>
  );
};

export default RecentExpenses;