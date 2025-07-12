
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, Upload } from 'lucide-react';
import Accounts from '../Accounts';
import RecentExpenses from '../RecentExpenses';
import FinancialGoals from '../FinancialGoals';
import SpendingAnalytics from '../SpendingAnalytics';
import AddExpenseModal, { NewExpenseData } from '../modals/AddExpenseModal';
import AddAccountModal from '../modals/AddAccountModal';
import AddTopUpModal from '../modals/AddTopUpModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import ExpenseDetailModal from '../modals/ExpenseDetailModal';
import ItemDetailModal from '../modals/ItemDetailModal';
import { Expense, Account, Goal, TopUp, RecurringIncome, Page, PredictedBudget, AggregatedItem, ExpenseItem } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Database } from '../../lib/database.types';
import WarningBanner from '../shared/WarningBanner';
import BudgetOverview from '../dashboard/BudgetOverview';
import StatCard from '../dashboard/StatCard';

const DashboardPage = ({ onNavigate, refreshTrigger }: {
  onNavigate: (page: Page) => void;
  refreshTrigger: number;
}) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [selectedItem, setSelectedItem] = useState<AggregatedItem | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [predictedBudgets, setPredictedBudgets] = useState<PredictedBudget[]>([]);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [fileToProcess, setFileToProcess] = useState<File | null>(null);
  
  const { profile } = useUser();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    if (!profile || !currentWorkspace.id) return;

    const cacheKey = `fintra_dashboard_data_${currentWorkspace.id}`;
    
    if (isRefresh) {
        setIsRefreshing(true);
    } else {
        try {
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                setAccounts(parsed.accounts || []);
                setGoals(parsed.goals || []);
                setExpenses(parsed.expenses || []);
                setTopups(parsed.topups || []);
                setRecurringIncomes(parsed.recurringIncomes || []);
                setPredictedBudgets(parsed.predictedBudgets || []);
                setLoading(false);
            } else {
                setLoading(true);
            }
        } catch (e) {
            console.error("Failed to load dashboard cache", e);
            sessionStorage.removeItem(cacheKey);
            setLoading(true);
        }
    }
    
    setError(null);
    setDeleteError(null);
    
    try {
      const accountsPromise = supabase.rpc('get_accounts_for_workspace', { p_workspace_id: currentWorkspace.id });
      const goalsPromise = supabase.from('goals').select('*, goal_payments(*)').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false });
      const expensesPromise = supabase.from('expenses').select('*, expense_items(*)').eq('workspace_id', currentWorkspace.id).order('date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      const topupsPromise = supabase.from('topups').select('*').eq('workspace_id', currentWorkspace.id);
      const recurringIncomesPromise = supabase.from('recurring_incomes').select('*').eq('workspace_id', currentWorkspace.id);
      const predictedBudgetsPromise = supabase.rpc('get_predicted_spending', { p_workspace_id: currentWorkspace.id });

      const [
        accountsResult,
        goalsResult,
        expensesResult,
        topupsResult,
        recurringIncomesResult,
        predictedBudgetsResult
      ] = await Promise.all([
          accountsPromise,
          goalsPromise,
          expensesPromise,
          topupsPromise,
          recurringIncomesPromise,
          predictedBudgetsPromise
      ]);
      
      if (accountsResult.error) throw new Error(`Accounts: ${accountsResult.error.message}`);
      if (goalsResult.error) throw new Error(`Goals: ${goalsResult.error.message}`);
      if (expensesResult.error) throw new Error(`Expenses: ${expensesResult.error.message}`);
      if (topupsResult.error) throw new Error(`Topups: ${topupsResult.error.message}`);
      if (recurringIncomesResult.error) throw new Error(`Recurring Incomes: ${recurringIncomesResult.error.message}`);
      if (predictedBudgetsResult.error) throw new Error(`Predicted Budgets: ${predictedBudgetsResult.error.message}`);

      const freshData = {
          accounts: (accountsResult.data as unknown as Account[]) || [],
          goals: (goalsResult.data as unknown as Goal[]) || [],
          expenses: (expensesResult.data as unknown as Expense[]) || [],
          topups: (topupsResult.data as unknown as TopUp[]) || [],
          recurringIncomes: (recurringIncomesResult.data as unknown as RecurringIncome[]) || [],
          predictedBudgets: (predictedBudgetsResult.data as unknown as PredictedBudget[]) || [],
      };
      
      setAccounts(freshData.accounts);
      setGoals(freshData.goals);
      setExpenses(freshData.expenses);
      setTopups(freshData.topups);
      setRecurringIncomes(freshData.recurringIncomes);
      setPredictedBudgets(freshData.predictedBudgets);
      
      sessionStorage.setItem(cacheKey, JSON.stringify(freshData));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [profile, currentWorkspace.id]);

  const addAccount = useCallback(async (newAccountData: Omit<Account, 'id' | 'created_at' | 'user_id' | 'workspace_id'>) => {
    if(!profile || !currentWorkspace.id) throw new Error("User or workspace not found");
    
    const accountToInsert: Database['public']['Tables']['accounts']['Insert'] = {
        name: newAccountData.name,
        type: newAccountData.type,
        balance: newAccountData.balance,
        icon_name: newAccountData.icon_name,
        workspace_id: currentWorkspace.id,
        user_id: profile.id
    };
    
    const { error } = await supabase.from('accounts').insert(accountToInsert);

    if (error) throw new Error(error.message);
    
    await fetchData(true);
    setIsAccountModalOpen(false);
  }, [profile, fetchData, currentWorkspace.id]);

  // Initial load
  useEffect(() => {
      if (profile && !workspaceLoading && currentWorkspace.id) {
          fetchData(false);
      }
  }, [profile, workspaceLoading, currentWorkspace.id, fetchData]);

  // Manual refresh
  useEffect(() => {
      if (refreshTrigger > 0 && profile && !workspaceLoading && currentWorkspace.id) {
          fetchData(true);
      }
  }, [refreshTrigger, profile, workspaceLoading, currentWorkspace.id, fetchData]);
  
  const closeExpenseModal = useCallback(() => {
    setEditingExpense(null);
    setIsExpenseModalOpen(false);
  }, []);

  const openAddExpenseModal = useCallback(() => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  }, []);

  const openAccountModal = useCallback(() => setIsAccountModalOpen(true), []);
  const closeAccountModal = useCallback(() => setIsAccountModalOpen(false), []);

  const openTopUpModal = useCallback(() => setIsTopUpModalOpen(true), []);
  const closeTopUpModal = useCallback(() => setIsTopUpModalOpen(false), []);
  
  const requestDeleteExpense = useCallback((id: string) => {
    setExpenseToDeleteId(id);
    setIsConfirmModalOpen(true);
  }, []);

  const aggregatedItems = useMemo((): AggregatedItem[] => {
    const itemsMap = new Map<string, AggregatedItem>();
    expenses.forEach(expense => {
        if (expense.expense_items) {
            expense.expense_items.forEach(item => {
                const itemName = item.name.trim().toLowerCase();
                if (!itemName) return;
                
                const existing = itemsMap.get(itemName);
                const itemCost = item.price * item.quantity;

                if (existing) {
                    existing.totalQuantity += item.quantity;
                    existing.totalSpent += itemCost;
                    existing.occurrences.push({ ...item, expenseTitle: expense.title, expenseDate: expense.date, expenseId: expense.id });
                } else {
                    itemsMap.set(itemName, {
                        name: item.name,
                        totalQuantity: item.quantity,
                        totalSpent: itemCost,
                        occurrences: [{ ...item, expenseTitle: expense.title, expenseDate: expense.date, expenseId: expense.id }]
                    });
                }
            });
        }
    });
    return Array.from(itemsMap.values());
  }, [expenses]);
  
  const handleViewItemHistory = useCallback((item: ExpenseItem) => {
    const itemToView = aggregatedItems.find(agg => agg.name.toLowerCase() === item.name.toLowerCase());
    if (itemToView) {
        setViewingExpense(null); // Close the expense detail modal
        setSelectedItem(itemToView); // Open the item detail modal
    }
  }, [aggregatedItems]);

  const addExpense = useCallback(async (newExpenseData: NewExpenseData) => {
    if(!profile || !currentWorkspace.id) throw new Error("User or workspace not found");
    const { items, ...expenseDetails } = newExpenseData;
    const rpcItems = items.map(item => ({ name: item.name, price: item.price, quantity: item.quantity }));

    const { error } = await supabase.rpc('add_expense', {
        p_user_id: profile.id,
        p_account_id: expenseDetails.account_id,
        p_title: expenseDetails.title,
        p_amount: expenseDetails.amount,
        p_category: expenseDetails.category,
        p_date: expenseDetails.date,
        p_time: expenseDetails.time || null,
        p_description: expenseDetails.description,
        p_items: rpcItems as any,
        p_workspace_id: currentWorkspace.id
    });
    
    if (error) {
        console.error('Supabase RPC Error (add_expense):', error);
        throw new Error(error.message);
    }
    fetchData(true); // Refresh data in the background
  }, [fetchData, profile?.id, currentWorkspace.id]);

  const updateExpense = useCallback(async (expenseId: string, updatedExpenseData: NewExpenseData) => {
    if(!profile) throw new Error("User not found");
    const { items, ...expenseDetails } = updatedExpenseData;
    const rpcItems = items.map(item => ({ name: item.name, price: item.price, quantity: item.quantity }));

    const { error } = await supabase.rpc('update_expense', {
        p_expense_id: expenseId,
        p_user_id: profile.id,
        p_new_account_id: expenseDetails.account_id,
        p_new_title: expenseDetails.title,
        p_new_amount: expenseDetails.amount,
        p_new_category: expenseDetails.category,
        p_new_date: expenseDetails.date,
        p_new_time: expenseDetails.time || null,
        p_new_description: expenseDetails.description,
        p_new_items: rpcItems as any,
    });

    if (error) {
        console.error('Supabase RPC Error (update_expense):', error);
        throw new Error(error.message);
    }
    fetchData(true); // Refresh data in the background
  }, [fetchData, profile?.id]);

  const handleConfirmDelete = useCallback(async () => {
    if (!expenseToDeleteId || !profile) {
      return;
    }
    
    setIsDeleting(true);
    setDeleteError(null);

    const originalExpenses = [...expenses];
    setExpenses(prevExpenses => prevExpenses.filter(exp => exp.id !== expenseToDeleteId)); 

    try {
      const { error } = await supabase.rpc('delete_expense', {
        p_expense_id: expenseToDeleteId,
        p_user_id: profile.id,
      });

      if (error) {
        throw error;
      }
      
      await fetchData(true);

    } catch (err) {
      console.error('Failed to delete expense:', err);
      setExpenses(originalExpenses); 
      setDeleteError(`Error: Could not delete the expense. The database responded with: ${(err as Error).message}`);
    } finally {
        setIsDeleting(false);
        setIsConfirmModalOpen(false);
        setExpenseToDeleteId(null);
    }
  }, [expenseToDeleteId, expenses, profile?.id, fetchData]);


  const addTopUp = useCallback(async (newTopUpData: Omit<TopUp, 'id' | 'created_at' | 'user_id' | 'workspace_id'>) => {
    if (!profile || !currentWorkspace.id) throw new Error("User or workspace not found");

    const { error } = await supabase.rpc('add_topup', {
        p_account_id: newTopUpData.account_id,
        p_amount: newTopUpData.amount,
        p_name: newTopUpData.name,
        p_description: newTopUpData.description || null,
        p_topup_time: newTopUpData.topup_time,
        p_user_id: profile.id,
        p_workspace_id: currentWorkspace.id
    });

    if (error) {
      console.error('Failed to save top-up:', error);
      throw error;
    }

    await fetchData(true);
    closeTopUpModal();
  }, [closeTopUpModal, fetchData, profile, currentWorkspace.id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setFileToProcess(file);
        openAddExpenseModal();
      }
      e.dataTransfer.clearData();
    }
  }, [openAddExpenseModal]);

  const { totalIncome, totalExpenses, netFlow } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const income = topups.filter(t => new Date(t.topup_time) >= startOfMonth).reduce((sum, t) => sum + t.amount, 0) +
                   recurringIncomes.filter(ri => ri.is_active).reduce((sum, ri) => sum + ri.amount, 0);
                   
    const expense = expenses.filter(e => new Date(e.date) >= startOfMonth).reduce((sum, e) => sum + e.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expense,
      netFlow: income - expense,
    }
  }, [expenses, topups, recurringIncomes]);


  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900 text-red-500 dark:text-red-400">
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">Failed to load dashboard data</h2>
            <p className="mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please check your network connection and try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
      return (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={48} className="animate-spin text-indigo-500" />
          </div>
      )
  }

  const handleEditExpense = (expense: Expense) => {
    setViewingExpense(null);
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };
  
  const handleDeleteExpense = (expense: Expense) => {
    setViewingExpense(null);
    requestDeleteExpense(expense.id);
  };

  return (
    <div
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
       {deleteError && (
            <WarningBanner message={deleteError} onDismiss={() => setDeleteError(null)} />
       )}
       {isDragging && (
        <div className="absolute inset-0 bg-indigo-500/30 backdrop-blur-sm border-4 border-dashed border-white dark:border-gray-300 rounded-2xl flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity animate-in fade-in-0">
          <Upload size={64} className="text-white mb-4" />
          <p className="text-2xl font-bold text-white drop-shadow-md">Drop Receipt to Add Expense</p>
        </div>
      )}

      <div className={`space-y-8 transition-opacity duration-300 ${isDragging ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Income" value={totalIncome} currency={profile.currency} colorClass="text-green-500" period="this month" />
            <StatCard title="Total Expenses" value={totalExpenses} currency={profile.currency} colorClass="text-red-500" period="this month" />
            <StatCard title="Net Flow" value={netFlow} currency={profile.currency} colorClass={netFlow >= 0 ? 'text-blue-500' : 'text-orange-500'} period="this month" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Accounts 
                    accounts={accounts}
                    onAddAccountClick={openAccountModal}
                    onTopUpClick={openTopUpModal}
                    onRefreshClick={() => fetchData(true)}
                    isRefreshing={isRefreshing}
                    currency={profile.currency} />
            </div>
            <div className="lg:col-span-2">
                <RecentExpenses 
                onAddExpenseClick={openAddExpenseModal} 
                expenses={expenses} 
                currency={profile.currency}
                onViewAllClick={() => onNavigate('transactions')}
                onViewExpense={setViewingExpense}
                />
            </div>
        </div>

         <BudgetOverview 
            expenses={expenses} 
            predictedBudgets={predictedBudgets} 
            currency={profile.currency} 
            onNavigate={() => onNavigate('budgeting')} 
          />
          <FinancialGoals 
            goals={goals} 
            currency={profile.currency} 
            onNavigate={() => onNavigate('financial_goals')}
          />
        <SpendingAnalytics expenses={expenses} currency={profile.currency} />
      </div>
      {isExpenseModalOpen && (
        <AddExpenseModal 
            accounts={accounts}
            recurringIncomes={recurringIncomes}
            expenseToEdit={editingExpense} 
            onClose={closeExpenseModal} 
            onAddExpense={addExpense} 
            onUpdateExpense={updateExpense} 
            defaultAccountId={profile.default_expense_account_id}
            receiptFile={fileToProcess}
            onClearReceiptFile={() => setFileToProcess(null)} 
        />
       )}
      {isAccountModalOpen && <AddAccountModal onClose={closeAccountModal} onAddAccount={addAccount} />}
      {isTopUpModalOpen && <AddTopUpModal accounts={accounts} onClose={closeTopUpModal} onAddTopUp={addTopUp} topUpToEdit={null} onUpdateTopUp={async () => {}} />}
      {isConfirmModalOpen && <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => !isDeleting && setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message="Are you sure you want to delete this expense? This action is permanent and cannot be undone."
          isConfirming={isDeleting}
          confirmText="Delete"
        />}
      {viewingExpense && (
        <ExpenseDetailModal
          expense={viewingExpense}
          account={accounts.find(a => a.id === viewingExpense.account_id)}
          currency={profile.currency}
          onClose={() => setViewingExpense(null)}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onViewItemHistory={handleViewItemHistory}
        />
      )}
      {selectedItem && (
        <ItemDetailModal
            item={selectedItem}
            currency={profile.currency}
            onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
