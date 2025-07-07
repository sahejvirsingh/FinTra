


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { CategoryBudget, ExpenseCategories, Expense, SupportedCurrencies } from '../../types';
import { formatCurrency } from '../../utils/currency';

const BudgetingPage = () => {
  const { profile } = useUser();
  const { currentWorkspace } = useWorkspace();
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetInputs, setBudgetInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const fetchData = useCallback(async () => {
    if (!profile || !currentWorkspace.id) return;
    setLoading(true);
    setMessage('');
    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('year', currentYear)
        .eq('month', currentMonth);
      if (budgetError) throw budgetError;
      const loadedBudgets = (budgetData as CategoryBudget[]) || [];
      setBudgets(loadedBudgets);
      
      const initialInputs = loadedBudgets.reduce((acc, b) => {
          acc[b.category] = String(b.amount);
          return acc;
      }, {} as {[key: string]: string});
      setBudgetInputs(initialInputs);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('workspace_id', currentWorkspace.id)
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      if (expensesError) throw expensesError;
      setExpenses((expensesData as Expense[]) || []);

    } catch (err) {
      console.error("Error fetching budgeting data:", err);
      setMessage("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [profile, currentWorkspace.id, currentYear, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleInputChange = (category: string, value: string) => {
    setBudgetInputs(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveBudgets = async () => {
    if (!profile || !currentWorkspace.id) return;
    setIsSaving(true);
    setMessage('');

    const budgetsToUpsert = Object.entries(budgetInputs)
        .filter(([_, value]) => value.trim() !== '')
        .map(([category, value]) => ({
            user_id: profile.id,
            workspace_id: currentWorkspace.id,
            year: currentYear,
            month: currentMonth,
            category: category,
            amount: parseFloat(value) || 0,
        }));
    
    try {
        const { error } = await supabase.rpc('upsert_category_budgets', { budgets: budgetsToUpsert });
        if (error) throw error;
        setMessage('Budgets saved successfully!');
        fetchData(); // Refresh data to get latest state
    } catch(err) {
        console.error("Failed to save budgets:", err);
        setMessage("Error: Could not save budgets.");
    } finally {
        setIsSaving(false);
        setTimeout(() => setMessage(''), 3000);
    }
  };

  const spendingPerCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as { [key: string]: number });
  }, [expenses]);
  
  const totalBudgeted = useMemo(() => {
      return Object.values(budgetInputs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [budgetInputs]);

  const totalSpent = useMemo(() => {
      return Object.values(spendingPerCategory).reduce((sum, val) => sum + val, 0);
  }, [spendingPerCategory]);

  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';

  if (loading || !profile) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Category Budgeting</h1>
            <p className="text-gray-500 dark:text-gray-400">Set and track your spending limits for this month.</p>
        </div>
        <button
            onClick={handleSaveBudgets}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors w-32 h-[42px] flex items-center justify-center disabled:opacity-50"
        >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={16} className="mr-2" /> Save</>}
        </button>
      </div>
      
      {message && <p className={`text-sm mb-4 text-center font-semibold ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Budgeted</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalBudgeted, profile!.currency)}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalSpent, profile!.currency)}</p>
            </div>
        </div>
        
        <div className="space-y-6">
          {ExpenseCategories.filter(cat => cat !== 'EMI' && cat !== 'Financial Goals').map((category) => {
            const budgetAmount = parseFloat(budgetInputs[category] || '0') || 0;
            const spentAmount = spendingPerCategory[category] || 0;
            const percentage = budgetAmount > 0 ? Math.min(100, (spentAmount / budgetAmount) * 100) : 0;
            let barColor = 'bg-green-500';
            if (percentage > 80) barColor = 'bg-red-500';
            else if (percentage > 50) barColor = 'bg-yellow-500';
            
            return (
              <div key={category}>
                <div className="grid grid-cols-1 md:grid-cols-[1fr,150px] gap-4 items-center mb-2">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{category}</h3>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
                    <input
                      type="number"
                      value={budgetInputs[category] || ''}
                      onChange={(e) => handleInputChange(category, e.target.value)}
                      placeholder="Set budget"
                      className={`${inputClasses} pl-7`}
                      step="10"
                    />
                  </div>
                </div>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatCurrency(spentAmount, profile!.currency)} of {formatCurrency(budgetAmount, profile!.currency)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetingPage;