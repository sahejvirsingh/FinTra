
import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { Expense, PredictedBudget } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface BudgetOverviewProps {
  expenses: Expense[];
  predictedBudgets: PredictedBudget[];
  currency: string;
  onNavigate: () => void;
}

const BudgetItem = ({ name, spent, budget, currency }: { name: string, spent: number, budget: number, currency:string }) => {
    const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : (spent > 0 ? 100 : 0);
    
    let barColor = 'bg-green-500';
    let textColor = 'text-green-600 dark:text-green-400';
    if (percentage > 90) {
        barColor = 'bg-red-500';
        textColor = 'text-red-600 dark:text-red-400';
    } else if (percentage > 75) {
        barColor = 'bg-orange-500';
        textColor = 'text-orange-600 dark:text-orange-400';
    } else if (percentage > 50) {
        barColor = 'bg-yellow-500';
        textColor = 'text-yellow-600 dark:text-yellow-400';
    }

    const tooltipText = `Spent: ${formatCurrency(spent, currency)}\nPredicted: ${formatCurrency(budget, currency)}\n${percentage.toFixed(0)}% used`;

    return (
        <div title={tooltipText}>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
                <span className="font-semibold">
                    <span className={textColor}>{formatCurrency(spent, currency)}</span>
                    <span className="text-gray-500 dark:text-gray-400"> / {formatCurrency(budget, currency)}</span>
                </span>
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

const BudgetOverview = ({ expenses, predictedBudgets, currency, onNavigate }: BudgetOverviewProps) => {

  const budgetData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const spendingByCategory: { [key: string]: number } = {};
    expenses.forEach(exp => {
        if (new Date(exp.date) >= startOfMonth) {
            spendingByCategory[exp.category] = (spendingByCategory[exp.category] || 0) + exp.amount;
        }
    });

    return predictedBudgets
        .map(budget => ({
            name: budget.category,
            spent: spendingByCategory[budget.category] || 0,
            budget: budget.predicted_amount
        }))
        .sort((a,b) => b.budget - a.budget);

  }, [expenses, predictedBudgets]);

  if (predictedBudgets.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center"><ClipboardList size={20} className="mr-3 text-indigo-500"/>Spending Guide</h2>
        <button onClick={onNavigate} className="text-sm font-semibold text-indigo-500 hover:underline">
          View Details
        </button>
      </div>

      <div className="space-y-4">
        {budgetData.slice(0, 4).map(item => (
            <BudgetItem key={item.name} {...item} currency={currency} />
        ))}
         {budgetData.length === 0 && <p className="text-center text-gray-500 py-4">No spending predictions available yet.</p>}
      </div>
    </div>
  );
};

export default BudgetOverview;
