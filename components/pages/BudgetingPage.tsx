
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { PredictedBudget, Expense, ExpenseCategories, SupportedCurrencies } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Database } from '../../lib/database.types';

const BudgetProgress = ({ spent, budget, currency }: { spent: number, budget: number, currency: string }) => {
    const overBudget = spent > budget;
    const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : (spent > 0 ? 100 : 0);

    let barColor = 'bg-green-500';
    if (overBudget) {
        barColor = 'bg-red-500';
    } else if (percentage > 90) {
        barColor = 'bg-red-500';
    } else if (percentage > 75) {
        barColor = 'bg-orange-500';
    } else if (percentage > 50) {
        barColor = 'bg-yellow-500';
    }

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{formatCurrency(spent, currency)}</span>
                <span>{overBudget && `Over by ${formatCurrency(spent - budget, currency)}`}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                    className={`${barColor} h-2.5 rounded-full transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};


const BudgetingPage = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const { profile } = useUser();
    const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
    
    // Data states
    const [predictedBudgets, setPredictedBudgets] = useState<PredictedBudget[]>([]);
    const [manualBudgets, setManualBudgets] = useState<Database['public']['Tables']['monthly_budgets']['Row'][]>([]);
    const [expenses, setExpenses] = useState<Pick<Expense, 'category' | 'amount'>[]>([]);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [localBudgetChanges, setLocalBudgetChanges] = useState<Record<string, string>>({});

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const fetchData = useCallback(async (isRefresh: boolean = false) => {
        if (!profile || !currentWorkspace.id) return;
        
        const cacheKey = `fintra_budgeting_data_${currentWorkspace.id}`;
        
        if (!isRefresh) {
            try {
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    setPredictedBudgets(parsed.predictedBudgets || []);
                    setManualBudgets(parsed.manualBudgets || []);
                    setExpenses(parsed.expenses || []);
                    const initialChanges: Record<string, string> = {};
                    (parsed.manualBudgets || []).forEach((b: any) => { initialChanges[b.category] = String(b.amount); });
                    setLocalBudgetChanges(initialChanges);
                    setLoading(false);
                } else {
                    setLoading(true);
                }
            } catch (e) {
                console.error("Failed to load budgeting cache", e);
                sessionStorage.removeItem(cacheKey);
                setLoading(true);
            }
        } else {
            setLoading(true);
        }

        setMessage('');
        try {
            const predictPromise = supabase.rpc('get_predicted_spending', { p_workspace_id: currentWorkspace.id });
            
            const manualPromise = supabase.from('monthly_budgets').select('*').eq('workspace_id', currentWorkspace.id).eq('year', currentYear).eq('month', currentMonth);

            const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
            const endOfMonthString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            const expensePromise = supabase.from('expenses').select('category, amount').eq('workspace_id', currentWorkspace.id).gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`).lt('date', endOfMonthString);
            
            const [
                { data: budgetData, error: budgetError },
                { data: manualData, error: manualError },
                { data: expensesData, error: expensesError }
            ] = await Promise.all([predictPromise, manualPromise, expensePromise]);

            if (budgetError) throw budgetError;
            if (manualError) throw manualError;
            if (expensesError) throw expensesError;

            const freshData = {
                predictedBudgets: budgetData || [],
                manualBudgets: manualData || [],
                expenses: expensesData || [],
            };

            setPredictedBudgets(freshData.predictedBudgets);
            setManualBudgets(freshData.manualBudgets);
            setExpenses(freshData.expenses);
            
            const initialChanges: Record<string, string> = {};
            (freshData.manualBudgets || []).forEach(b => {
                initialChanges[b.category] = String(b.amount);
            });
            setLocalBudgetChanges(initialChanges);
            
            sessionStorage.setItem(cacheKey, JSON.stringify(freshData));
        } catch (err) {
            setMessage((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [profile, currentWorkspace.id, currentYear, currentMonth]);

    useEffect(() => {
        if (currentWorkspace.id && profile && !workspaceLoading) {
            fetchData(false);
        }
    }, [profile, workspaceLoading, currentWorkspace.id, fetchData]);
    
    useEffect(() => {
        if (refreshTrigger > 0 && currentWorkspace.id && profile && !workspaceLoading) {
            fetchData(true);
        }
    }, [refreshTrigger, profile, workspaceLoading, currentWorkspace.id, fetchData]);


    const spendingByCategory = useMemo(() => {
        const spending: Record<string, number> = {};
        expenses.forEach(exp => {
            spending[exp.category] = (spending[exp.category] || 0) + exp.amount;
        });
        return spending;
    }, [expenses]);
    
    const combinedBudgets = useMemo(() => {
        const allCategories = new Set([...ExpenseCategories, ...predictedBudgets.map(b => b.category), ...manualBudgets.map(b => b.category)]);
        
        return Array.from(allCategories).map(category => {
            const manual = manualBudgets.find(b => b.category === category);
            const predicted = predictedBudgets.find(b => b.category === category);
            
            return {
                category,
                spent: spendingByCategory[category] || 0,
                budget: manual?.amount ?? predicted?.predicted_amount ?? 0,
                isManual: !!manual,
                isPredicted: !manual && !!predicted
            }
        }).sort((a,b) => b.budget - a.budget);
    }, [predictedBudgets, manualBudgets, spendingByCategory]);

    const handleBudgetChange = (category: string, value: string) => {
        setLocalBudgetChanges(prev => ({ ...prev, [category]: value }));
    };
    
    const handleSaveBudgets = async () => {
        if (!profile || !currentWorkspace.id) return;
        setIsSaving(true);
        setMessage('');

        const budgetsToUpsert = Object.entries(localBudgetChanges)
            .filter(([_, amount]) => amount !== '' && !isNaN(parseFloat(amount)))
            .map(([category, amount]) => ({
                user_id: profile.id,
                workspace_id: currentWorkspace.id,
                category,
                amount: parseFloat(amount),
                year: currentYear,
                month: currentMonth
            }));
            
        if (budgetsToUpsert.length > 0) {
            const { error } = await supabase.rpc('upsert_monthly_budgets', { budgets: budgetsToUpsert as any });
            if (error) {
                setMessage(`Error saving budgets: ${error.message}`);
            } else {
                setMessage('Budgets saved successfully!');
                await fetchData(true);
            }
        }
        setIsSaving(false);
        setTimeout(() => setMessage(''), 3000);
    }
    
    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
    }
    if (!profile) return null;
    
    const initialManualBudgets = manualBudgets.reduce((acc, b) => ({...acc, [b.category]: String(b.amount)}), {});
    const hasChanges = JSON.stringify(localBudgetChanges) !== JSON.stringify(initialManualBudgets);
    const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monthly Budget</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your spending for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
                </div>
                 <button onClick={handleSaveBudgets} disabled={isSaving || !hasChanges} className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors h-[42px] w-32 disabled:opacity-50">
                    {isSaving ? <Loader2 size={18} className="animate-spin"/> : <><Save size={16} className="mr-2" /> Save</> }
                </button>
            </div>
            
            {message && <div className={`p-3 rounded-lg text-sm text-center ${message.includes('Error') ? 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300'}`}>{message}</div>}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
                <div className="grid grid-cols-[1fr,1fr,150px] items-center gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
                    <span>Category</span>
                    <span>Progress</span>
                    <span className="text-right">Budget Amount</span>
                </div>
                {combinedBudgets.map(({ category, spent, budget, isManual, isPredicted }) => (
                    <div key={category} className="grid grid-cols-[1fr,1fr,150px] items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{category}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isManual ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {isManual ? 'Manual' : (isPredicted ? 'Predicted' : 'Unbudgeted')}
                            </span>
                        </div>
                        <BudgetProgress spent={spent} budget={budget} currency={profile.currency} />
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
                           <input 
                                type="number" 
                                placeholder={budget > 0 ? budget.toFixed(2) : '0.00'}
                                value={localBudgetChanges[category] ?? ''}
                                onChange={(e) => handleBudgetChange(category, e.target.value)}
                                className="w-full pl-7 pr-2 py-2 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                           />
                        </div>
                    </div>
                ))}
                 {combinedBudgets.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                         <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                         <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No data available</h3>
                         <p className="mt-1 text-sm text-gray-500">Start by adding some expenses to see budget predictions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetingPage;
