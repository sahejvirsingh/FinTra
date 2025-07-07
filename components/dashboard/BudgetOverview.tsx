
import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { Expense, CategoryBudget } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface BudgetOverviewProps {
  expenses: Expense[];
  categoryBudgets: CategoryBudget[];
  currency: string;
  onNavigate: () => void;
}

const BudgetItem = ({ name, spent, budget, currency }: { name: string, spent: number, budget: number, currency: string }) => {
    const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    
    let barColor = 'bg-green-500';
    if (percentage > 80) barColor = 'bg-red-500';
    else if (percentage > 50) barColor = 'bg-yellow-500';

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
                <span className="text-gray-500 dark:text-gray-400">{formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                    className={`${barColor} h-2 rounded-full transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    )
}

const BudgetOverview = ({ expenses, categoryBudgets, currency, onNavigate }: BudgetOverviewProps) => {

  const budgetData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const spendingByCategory: { [key: string]: number } = {};
    expenses.forEach(exp => {
        if (new Date(exp.date) >= startOfMonth) {
            spendingByCategory[exp.category] = (spendingByCategory[exp.category] || 0) + exp.amount;
        }
    });

    return categoryBudgets
        .map(budget => ({
            name: budget.category,
            spent: spendingByCategory[budget.category] || 0,
            budget: budget.amount
        }))
        .sort((a,b) => b.budget - a.budget);

  }, [expenses, categoryBudgets]);

  if (categoryBudgets.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center"><ClipboardList size={20} className="mr-3 text-indigo-500"/>Budget Overview</h2>
        <button onClick={onNavigate} className="text-sm font-semibold text-indigo-500 hover:underline">
          Manage Budgets
        </button>
      </div>

      <div className="space-y-4">
        {budgetData.slice(0, 4).map(item => (
            <BudgetItem key={item.name} {...item} currency={currency} />
        ))}
         {budgetData.length === 0 && <p className="text-center text-gray-500 py-4">No budgets set for this month.</p>}
      </div>
    </div>
  );
};

export default BudgetOverview;
