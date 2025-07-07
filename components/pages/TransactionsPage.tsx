



import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2, Search, ArrowDownCircle, ArrowUpCircle, Target, CalendarClock, Filter, Package, X, ArrowUpDown, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { Expense, TopUp, Account, ExpenseItem, RecurringIncome } from '../../types';
import { formatCurrency } from '../../utils/currency';
import AddExpenseModal, { NewExpenseData } from '../modals/AddExpenseModal';
import AddTopUpModal from '../modals/AddTopUpModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import ExpenseDetailModal from '../modals/ExpenseDetailModal';
import ItemDetailModal from '../modals/ItemDetailModal';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Database } from '../../lib/database.types';


type UnifiedTransaction = {
    id: string;
    type: 'expense' | 'topup';
    title: string;
    amount: number;
    date: string;
    created_at: string;
    category?: string;
    description?: string;
    original: Expense | TopUp;
};

export type AggregatedItem = {
  name: string;
  totalQuantity: number;
  totalSpent: number;
  occurrences: (ExpenseItem & {
    expenseTitle: string;
    expenseDate: string;
    expenseId: string;
  })[];
};

type TransactionSortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type ItemSortOption = 'spent-desc' | 'spent-asc' | 'quantity-desc' | 'quantity-asc' | 'alpha-asc' | 'alpha-desc';

const transactionSortOptions: { value: TransactionSortOption; label: string }[] = [
    { value: 'date-desc', label: 'Date (Newest First)' },
    { value: 'date-asc', label: 'Date (Oldest First)' },
    { value: 'amount-desc', label: 'Amount (High to Low)' },
    { value: 'amount-asc', label: 'Amount (Low to High)' },
];

const itemSortOptions: { value: ItemSortOption; label: string }[] = [
    { value: 'spent-desc', label: 'Total Spent (High to Low)' },
    { value: 'spent-asc', label: 'Total Spent (Low to High)' },
    { value: 'quantity-desc', label: 'Total Quantity (High to Low)' },
    { value: 'quantity-asc', label: 'Total Quantity (Low to High)' },
    { value: 'alpha-asc', label: 'Alphabetical (A-Z)' },
    { value: 'alpha-desc', label: 'Alphabetical (Z-A)' },
];

const TransactionsPage = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [topups, setTopups] = useState<TopUp[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { profile } = useUser();
    const { currentWorkspace } = useWorkspace();

    // UI State
    const [viewMode, setViewMode] = useState<'transactions' | 'items'>('transactions');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    
    // Filters & Sort State
    const [activeFilters, setActiveFilters] = useState({ type: 'all', date: 'all' });
    const [sortBy, setSortBy] = useState<TransactionSortOption | ItemSortOption>('date-desc');
    const filtersAreActive = activeFilters.type !== 'all' || activeFilters.date !== 'all';

    // Modal States
    const [editingItem, setEditingItem] = useState<UnifiedTransaction | null>(null);
    const [deletingItem, setDeletingItem] = useState<UnifiedTransaction | null>(null);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
    const [selectedItem, setSelectedItem] = useState<AggregatedItem | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const useClickOutside = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
        useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
              callback();
            }
          };
          document.addEventListener('mousedown', handleClickOutside);
          return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [ref, callback]);
    };
    
    useClickOutside(filterRef, () => setIsFilterOpen(false));
    useClickOutside(sortRef, () => setIsSortOpen(false));


    const fetchData = useCallback(async () => {
        if (!profile || !currentWorkspace.id) return;
        setLoading(true);
        setError(null);
        try {
            const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('*, expense_items(*)').eq('workspace_id', currentWorkspace.id);
            if (expensesError) throw new Error(`Expenses: ${expensesError.message}`);
            setExpenses((expensesData as Expense[]) || []);

            const { data: topupsData, error: topupsError } = await supabase.from('topups').select('*').eq('workspace_id', currentWorkspace.id);
            if (topupsError) throw new Error(`Topups: ${topupsError.message}`);
            setTopups(topupsData || []);
            
            const { data: recurringData, error: recurringError } = await supabase.from('recurring_incomes').select('*').eq('workspace_id', currentWorkspace.id);
            if (recurringError) throw new Error(`Recurring Incomes: ${recurringError.message}`);
            setRecurringIncomes(recurringData || []);

            const { data: accountsData, error: accountsError } = await supabase.rpc('get_accounts_for_workspace', { p_workspace_id: currentWorkspace.id });
            if (accountsError) throw new Error(`Accounts: ${accountsError.message}`);
            setAccounts((accountsData as Account[]) || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [profile, currentWorkspace.id]);

    useEffect(() => {
        if (currentWorkspace.id) {
           fetchData();
        }
    }, [fetchData, currentWorkspace.id]);
    
    const handleUpdateExpense = async (expenseId: string, expenseData: NewExpenseData) => {
       await supabase.rpc('update_expense', {
            p_expense_id: expenseId,
            p_user_id: profile!.id,
            p_new_account_id: expenseData.account_id,
            p_new_title: expenseData.title,
            p_new_amount: expenseData.amount,
            p_new_category: expenseData.category,
            p_new_date: expenseData.date,
            p_new_time: expenseData.time || null,
            p_new_description: expenseData.description,
            p_new_items: expenseData.items,
        });
       await fetchData();
       setIsExpenseModalOpen(false);
       setEditingItem(null);
    };
    
    const handleUpdateTopUp = async (id: string, data: Omit<TopUp, 'id'|'created_at'|'user_id'|'workspace_id'>) => {
        const updateData: Database['public']['Tables']['topups']['Update'] = data;
        const { error } = await supabase.from('topups').update(updateData as any).eq('id', id);
        if (error) throw new Error(error.message);
        await fetchData();
        setIsTopUpModalOpen(false);
        setEditingItem(null);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem || !profile) return;
        setIsSubmitting(true);
        if (deletingItem.type === 'expense') {
            await supabase.rpc('delete_expense', { p_expense_id: deletingItem.id, p_user_id: profile.id });
        } else if (deletingItem.type === 'topup') {
            await supabase.rpc('delete_topup', { p_topup_id: deletingItem.id });
        }
        await fetchData();
        setIsSubmitting(false);
        setIsConfirmOpen(false);
        setDeletingItem(null);
    };
    
    const allTransactions: UnifiedTransaction[] = useMemo(() => {
        const expenseTransactions: UnifiedTransaction[] = expenses.map(e => ({
            id: e.id, type: 'expense', title: e.title, amount: e.amount, date: e.date, created_at: e.created_at, category: e.category, description: e.description, original: e
        }));
        const topupTransactions: UnifiedTransaction[] = topups.map(t => ({
            id: t.id, type: 'topup', title: t.name, amount: t.amount, date: t.topup_time, created_at: t.created_at, description: t.description, category: 'Income', original: t
        }));
        return [...expenseTransactions, ...topupTransactions];
    }, [expenses, topups]);
    
    const { filteredTransactions, filteredExpenses } = useMemo(() => {
        let transactionItems: UnifiedTransaction[] = [...allTransactions];
        
        // Filter by type
        if (activeFilters.type !== 'all') {
            transactionItems = transactionItems.filter(t => t.type === activeFilters.type);
        }

        // Filter by date
        if (activeFilters.date !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let startDate;
            if (activeFilters.date === 'month') {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (activeFilters.date === 'year') {
                startDate = new Date(today.getFullYear(), 0, 1);
            } else { // 'week'
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 7);
            }
            transactionItems = transactionItems.filter(t => new Date(t.date) >= startDate);
        }
        
        // Filter by search term
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            transactionItems = transactionItems.filter(t => {
                const standardMatch = t.title.toLowerCase().includes(lowerSearch) || 
                                  String(t.amount).includes(lowerSearch) || 
                                  (t.category && t.category.toLowerCase().includes(lowerSearch));
                if (standardMatch) return true;
                if (t.type === 'expense') {
                    const expense = t.original as Expense;
                    const itemMatch = expense.expense_items?.some(item => item.name.toLowerCase().includes(lowerSearch));
                    return !!itemMatch;
                }
                return false;
            });
        }

        const fExpenses = transactionItems.filter(t => t.type === 'expense').map(t => t.original as Expense);

        return {
            filteredTransactions: transactionItems,
            filteredExpenses: fExpenses,
        };
    }, [allTransactions, searchTerm, activeFilters]);

    const sortedTransactions = useMemo(() => {
        const items = [...filteredTransactions];
        items.sort((a, b) => {
            switch (sortBy as TransactionSortOption) {
                case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                case 'date-desc':
                default:
                     const dateA = new Date(a.date).getTime();
                     const dateB = new Date(b.date).getTime();
                     if(dateB === dateA) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                     return dateB - dateA;
            }
        });
        return items;
    }, [filteredTransactions, sortBy]);

    const sortedItems = useMemo((): AggregatedItem[] => {
        const itemsMap = new Map<string, AggregatedItem>();
        filteredExpenses.forEach(expense => {
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
        
        let sorted = Array.from(itemsMap.values());
        
        sorted.sort((a, b) => {
             switch (sortBy as ItemSortOption) {
                case 'spent-desc': return b.totalSpent - a.totalSpent;
                case 'spent-asc': return a.totalSpent - b.totalSpent;
                case 'quantity-desc': return b.totalQuantity - a.totalQuantity;
                case 'quantity-asc': return a.totalQuantity - b.totalQuantity;
                case 'alpha-asc': return a.name.localeCompare(b.name);
                case 'alpha-desc': return b.name.localeCompare(a.name);
                default: return b.totalSpent - a.totalSpent;
             }
        });

        return sorted;
    }, [filteredExpenses, sortBy]);


    const handleEditRequest = (item: UnifiedTransaction) => {
        setViewingExpense(null); setEditingItem(item);
        if (item.type === 'expense') setIsExpenseModalOpen(true);
        else if (item.type === 'topup') setIsTopUpModalOpen(true);
    };
    const handleDeleteRequest = (item: UnifiedTransaction) => {
        setViewingExpense(null); setDeletingItem(item); setIsConfirmOpen(true);
    };
    const handleEditExpense = (expense: Expense) => {
        const item = allTransactions.find(t => t.id === expense.id && t.type === 'expense');
        if (item) handleEditRequest(item);
    };
    const handleDeleteExpense = (expense: Expense) => {
        const item = allTransactions.find(t => t.id === expense.id && t.type === 'expense');
        if (item) handleDeleteRequest(item);
    };
    const handleTransactionClick = (item: UnifiedTransaction) => {
      if (item.type === 'expense') setViewingExpense(item.original as Expense);
      else handleEditRequest(item);
    };
    
    const handleViewChange = (mode: 'transactions' | 'items') => {
        setViewMode(mode);
        if (mode === 'items') {
            setSortBy('spent-desc');
        } else {
            setSortBy('date-desc');
        }
    }

    if (loading || !profile) return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
    if (error) return <div className="text-red-500">Error loading transactions: {error}</div>;
    
    const getTransactionIcon = (t: UnifiedTransaction) => {
        if (t.type === 'topup') return <ArrowUpCircle className="w-8 h-8 text-green-500" />;
        switch (t.category) {
            case 'Financial Goals': return <Target className="w-8 h-8 text-blue-500" />;
            case 'EMI': return <CalendarClock className="w-8 h-8 text-orange-500" />;
            default: return <ArrowDownCircle className="w-8 h-8 text-red-500" />;
        }
    }
    const getTransactionAmount = (t: UnifiedTransaction) => {
        const isIncome = t.type === 'topup';
        const sign = isIncome ? '+' : '-';
        const color = isIncome ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
        return <p className={`font-semibold ${color}`}>{sign}{formatCurrency(t.amount, profile.currency)}</p>
    }

    const FilterButton = ({label, value, group}: {label: string, value: string, group: 'type' | 'date'}) => {
      const isActive = activeFilters[group] === value;
      return (
        <button 
          onClick={() => setActiveFilters(prev => ({ ...prev, [group]: value }))}
          className={`px-3 py-1.5 text-sm rounded-md w-full text-left flex items-center justify-between ${isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          {label}
          {isActive && <Check size={16}/>}
        </button>
      )
    }

    const SortButton = ({label, value}: {label: string, value: string}) => {
        const isActive = sortBy === value;
        return (
          <button 
            onClick={() => { setSortBy(value as any); setIsSortOpen(false); }}
            className={`px-3 py-1.5 text-sm rounded-md w-full text-left flex items-center justify-between ${isActive ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            {label}
            {isActive && <Check size={16}/>}
          </button>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">All Transactions</h1>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="Search by title, category, or amount..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"/></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-full w-full">
                      <button onClick={() => handleViewChange('transactions')} className={`px-4 py-1.5 text-sm rounded-full transition-all font-semibold w-1/2 text-center ${viewMode === 'transactions' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Transactions</button>
                      <button onClick={() => handleViewChange('items')} className={`px-4 py-1.5 text-sm rounded-full transition-all font-semibold w-1/2 text-center ${viewMode === 'items' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Items</button>
                  </div>
                  <div className="relative" ref={sortRef}>
                      <button onClick={() => setIsSortOpen(!isSortOpen)} className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                          <ArrowUpDown size={20} />
                      </button>
                      {isSortOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10 p-2 animate-in fade-in-0 zoom-in-95">
                              <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Sort By</p>
                              {viewMode === 'transactions' 
                               ? transactionSortOptions.map(opt => <SortButton key={opt.value} {...opt} />)
                               : itemSortOptions.map(opt => <SortButton key={opt.value} {...opt} />)
                              }
                          </div>
                      )}
                  </div>
                  <div className="relative" ref={filterRef}>
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="relative p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <Filter size={20} />
                        {filtersAreActive && <span className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>}
                    </button>
                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10 p-4 animate-in fade-in-0 zoom-in-95">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Filters</h4>
                                <button onClick={() => setActiveFilters({ type: 'all', date: 'all' })} className="text-xs font-semibold text-indigo-500 hover:underline">Reset</button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Type</p>
                                    <div className="space-y-1"><FilterButton label="All" value="all" group="type" /><FilterButton label="Expenses" value="expense" group="type" /><FilterButton label="Top-ups / Income" value="topup" group="type" /></div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Date Range</p>
                                    <div className="space-y-1"><FilterButton label="All Time" value="all" group="date" /><FilterButton label="This Week" value="week" group="date" /><FilterButton label="This Month" value="month" group="date" /><FilterButton label="This Year" value="year" group="date" /></div>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-6">
                <div className="overflow-x-auto">
                {viewMode === 'transactions' ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedTransactions.map(t => (
                            <li key={t.id} onClick={() => handleTransactionClick(t)} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {getTransactionIcon(t)}
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.category || new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {getTransactionAmount(t)}
                                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                </div>
                            </li>
                        ))}
                         {sortedTransactions.length === 0 && <p className="text-center text-gray-500 py-10">No transactions found.</p>}
                    </ul>
                ) : (
                     <table className="w-full text-left">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Item Name</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Total Spent</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Total Quantity</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Occurrences</th>
                            </tr>
                        </thead>
                        <tbody>
                        {sortedItems.map(item => (
                            <tr key={item.name} onClick={() => setSelectedItem(item)} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                <td className="p-4 font-medium text-gray-900 dark:text-white capitalize">{item.name}</td>
                                <td className="p-4 text-right">{formatCurrency(item.totalSpent, profile.currency)}</td>
                                <td className="p-4 text-right">{item.totalQuantity}</td>
                                <td className="p-4 text-center">{item.occurrences.length}</td>
                            </tr>
                        ))}
                         {sortedItems.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-10">No items found.</td></tr>}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

             {/* Modals */}
             {isExpenseModalOpen && editingItem?.type === 'expense' && (
                <AddExpenseModal
                    accounts={accounts}
                    recurringIncomes={recurringIncomes}
                    expenseToEdit={editingItem.original as Expense}
                    onClose={() => { setIsExpenseModalOpen(false); setEditingItem(null); }}
                    onAddExpense={async () => {}} // Not used here
                    onUpdateExpense={handleUpdateExpense}
                    defaultAccountId={profile.default_expense_account_id}
                />
            )}
             {isTopUpModalOpen && editingItem?.type === 'topup' && (
                <AddTopUpModal
                    accounts={accounts}
                    topUpToEdit={editingItem.original as TopUp}
                    onClose={() => { setIsTopUpModalOpen(false); setEditingItem(null); }}
                    onAddTopUp={async () => {}} // Not used here
                    onUpdateTopUp={handleUpdateTopUp}
                />
            )}
            {isConfirmOpen && <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingItem?.type}`}
                message={`Are you sure you want to delete this ${deletingItem?.type}? This action cannot be undone.`}
                isConfirming={isSubmitting}
                confirmText="Delete"
            />}
            {viewingExpense && <ExpenseDetailModal
                expense={viewingExpense}
                account={accounts.find(a => a.id === viewingExpense.account_id)}
                currency={profile.currency}
                onClose={() => setViewingExpense(null)}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
            />}
            {selectedItem && <ItemDetailModal
                item={selectedItem}
                currency={profile.currency}
                onClose={() => setSelectedItem(null)}
            />}

        </div>
    );
};

export default TransactionsPage;