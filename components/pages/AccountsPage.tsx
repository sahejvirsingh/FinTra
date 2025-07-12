
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabaseClient';
import { Account, RecurringIncome, iconMap } from '../../types';
import AddAccountModal from '../modals/AddAccountModal';
import AddRecurringIncomeModal from '../modals/AddRecurringIncomeModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import { formatCurrency } from '../../utils/currency';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import WarningBanner from '../shared/WarningBanner';
import { Database } from '../../lib/database.types';

const AccountHealthBar = ({ balance, monthlyIncome, currency }: {
    balance: number;
    monthlyIncome: number;
    currency: string;
}) => {
    if (monthlyIncome <= 0) return null;

    const percentage = Math.max(0, Math.min(100, (balance / monthlyIncome) * 100));
    let barColor = 'bg-green-500';
    if (percentage < 25) barColor = 'bg-red-500';
    else if (percentage < 50) barColor = 'bg-yellow-500';
    
    return (
        <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                    className={`${barColor} h-2 rounded-full transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                <span className="font-medium">{formatCurrency(balance, currency)}</span>
                <span>of {formatCurrency(monthlyIncome, currency)}</span>
            </div>
        </div>
    );
};

const AccountsPage = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const { profile } = useUser();
    const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
    
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Modal states
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isRecurringIncomeModalOpen, setIsRecurringIncomeModalOpen] = useState(false);
    const [incomeToEdit, setIncomeToEdit] = useState<RecurringIncome | null>(null);
    const [isConfirmDeleteIncomeOpen, setIsConfirmDeleteIncomeOpen] = useState(false);
    const [incomeToDeleteId, setIncomeToDeleteId] = useState<string | null>(null);
    const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const primaryCurrency = profile?.currency || 'USD';

    const fetchData = useCallback(async (isRefresh: boolean = false) => {
        if (!profile || !currentWorkspace.id) return;
        
        const cacheKey = `fintra_accounts_data_${currentWorkspace.id}`;

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            try {
                const cachedData = sessionStorage.getItem(cacheKey);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    setAccounts(parsed.accounts || []);
                    setRecurringIncomes(parsed.recurringIncomes || []);
                    setLoading(false);
                } else {
                    setLoading(true);
                }
            } catch (e) {
                console.error('Failed to load accounts cache', e);
                sessionStorage.removeItem(cacheKey);
                setLoading(true);
            }
        }
        
        setDeleteError(null);

        try {
            const accountsPromise = supabase.rpc('get_accounts_for_workspace', { p_workspace_id: currentWorkspace.id });
            const recurringIncomesPromise = supabase.from('recurring_incomes').select('*').eq('workspace_id', currentWorkspace.id).order('created_at');

            const [
                { data: accountsData, error: accountsError },
                { data: recurringIncomesData, error: recurringIncomesError },
            ] = await Promise.all([accountsPromise, recurringIncomesPromise]);

            if (accountsError) throw new Error(`Accounts: ${accountsError.message}`);
            if (recurringIncomesError) throw new Error(`Recurring Incomes: ${recurringIncomesError.message}`);

            const freshData = {
                accounts: (accountsData as unknown as Account[]) || [],
                recurringIncomes: (recurringIncomesData as unknown as RecurringIncome[]) || [],
            };

            setAccounts(freshData.accounts);
            setRecurringIncomes(freshData.recurringIncomes);

            sessionStorage.setItem(cacheKey, JSON.stringify(freshData));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [profile, currentWorkspace.id]);

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
    
    const { totalAssets, totalLiabilities, netWorth, monthlyIncomePerAccount } = useMemo(() => {
        const assets = accounts.filter(acc => acc.type !== 'Credit Card' && acc.type !== 'Loan').reduce((sum, acc) => sum + acc.balance, 0);
        const liabilities = accounts.filter(acc => acc.type === 'Credit Card' || acc.type === 'Loan').reduce((sum, acc) => sum + acc.balance, 0);
        
        const incomeMap = new Map<string, number>();
        recurringIncomes.forEach(income => {
            if (income.is_active) {
                incomeMap.set(income.account_id, (incomeMap.get(income.account_id) || 0) + income.amount);
            }
        });
        
        return {
            totalAssets: assets,
            totalLiabilities: liabilities,
            netWorth: assets - liabilities,
            monthlyIncomePerAccount: incomeMap,
        };
    }, [accounts, recurringIncomes]);
    
    const handleAddAccount = useCallback(async (newAccountData: Omit<Account, 'id' | 'created_at' | 'user_id' | 'workspace_id'>) => {
        if(!profile || !currentWorkspace.id) throw new Error("User or workspace not found");
        const accountToInsert: Database['public']['Tables']['accounts']['Insert'] = { ...newAccountData, user_id: profile.id, workspace_id: currentWorkspace.id };
        const { error } = await supabase.from('accounts').insert(accountToInsert);
        if (error) throw new Error(error.message);
        await fetchData(true);
        setIsAccountModalOpen(false);
    }, [profile, fetchData, currentWorkspace.id]);

    const handleDeleteAccountRequest = (account: Account) => {
        setAccountToDelete(account);
        setIsConfirmDeleteAccountOpen(true);
    };

    const handleConfirmDeleteAccount = async () => {
        if (!accountToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { error } = await supabase.rpc('delete_account', { p_account_id: accountToDelete.id });
            if(error) {
                throw error;
            } else {
                await fetchData(true);
            }
        } catch(err) {
            setDeleteError(`Failed to delete account: ${(err as Error).message}`);
        }
        setIsDeleting(false);
        setAccountToDelete(null);
        setIsConfirmDeleteAccountOpen(false);
    };

    const handleAddRecurringIncome = async (data: Omit<RecurringIncome, 'id'|'created_at'|'user_id' | 'workspace_id'>) => {
        if (!profile || !currentWorkspace.id) return;
        const incomeToInsert: Database['public']['Tables']['recurring_incomes']['Insert'] = { ...data, user_id: profile.id, workspace_id: currentWorkspace.id };
        const { error } = await supabase.from('recurring_incomes').insert(incomeToInsert);
        if (error) throw new Error(error.message);
        fetchData(true);
        setIsRecurringIncomeModalOpen(false);
    }
    const handleUpdateRecurringIncome = async (id: string, data: Omit<RecurringIncome, 'id'|'created_at'|'user_id' | 'workspace_id'>) => {
        const updateData: Database['public']['Tables']['recurring_incomes']['Update'] = data;
        await supabase.from('recurring_incomes').update(updateData).eq('id', id);
        fetchData(true);
        setIsRecurringIncomeModalOpen(false);
        setIncomeToEdit(null);
    }
    const handleDeleteRecurringIncome = async () => {
        if(!incomeToDeleteId) return;
        setIsDeleting(true);
        await supabase.from('recurring_incomes').delete().eq('id', incomeToDeleteId);
        fetchData(true);
        setIsDeleting(false);
        setIsConfirmDeleteIncomeOpen(false);
        setIncomeToDeleteId(null);
    }
    
    const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6";
    const getAccountLabel = (accId: string) => accounts.find(a => a.id === accId)?.name || 'Unknown';

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
    }
    if (!profile) return null;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounts Hub</h1>
            {deleteError && <WarningBanner message={deleteError} onDismiss={() => setDeleteError(null)} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cardClasses}><div className="flex items-center gap-4"><div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg"><TrendingUp className="text-green-600 dark:text-green-400"/></div><div><p className="text-gray-500">Total Assets</p><p className="text-2xl font-bold text-green-500">{formatCurrency(totalAssets, primaryCurrency)}</p></div></div></div>
                <div className={cardClasses}><div className="flex items-center gap-4"><div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg"><TrendingDown className="text-red-600 dark:text-red-400"/></div><div><p className="text-gray-500">Total Liabilities</p><p className="text-2xl font-bold text-red-500">{formatCurrency(totalLiabilities, primaryCurrency)}</p></div></div></div>
                <div className={cardClasses}><div className="flex items-center gap-4"><div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><Wallet className="text-indigo-600 dark:text-indigo-400"/></div><div><p className="text-gray-500">Net Worth</p><p className="text-2xl font-bold text-indigo-500">{formatCurrency(netWorth, primaryCurrency)}</p></div></div></div>
            </div>

            <div className="space-y-8">
                <div className={cardClasses}>
                    <div className="flex justify-between items-center mb-4">
                       <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Accounts</h2>
                       <button onClick={() => setIsAccountModalOpen(true)} className="flex items-center text-sm font-semibold text-indigo-500 hover:underline"><Plus size={16} className="mr-1"/>Add Account</button>
                    </div>
                    <div className="space-y-4">
                        {accounts.map(account => {
                            const Icon = iconMap[account.icon_name] || iconMap.default;
                            const accountIncome = monthlyIncomePerAccount.get(account.id) || 0;
                            return (
                                <div key={account.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full"><Icon className="w-6 h-6 text-gray-700 dark:text-gray-200" /></div>
                                            <div>
                                                <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{account.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{account.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-right">
                                                <p className={`font-bold text-lg ${account.balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{formatCurrency(account.balance, primaryCurrency)}</p>
                                            </div>
                                            <button onClick={() => handleDeleteAccountRequest(account)} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <AccountHealthBar balance={account.balance} monthlyIncome={accountIncome} currency={primaryCurrency} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <div className={cardClasses}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recurring Incomes</h2>
                        <button onClick={() => { setIncomeToEdit(null); setIsRecurringIncomeModalOpen(true); }} className="flex items-center text-sm font-semibold text-indigo-500 hover:underline"><Plus size={16} className="mr-1"/>Add Income</button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {recurringIncomes.length > 0 ? recurringIncomes.map(income => (
                            <div key={income.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">{income.name} ({getAccountLabel(income.account_id)})</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(income.amount, primaryCurrency)} on day {income.day_of_month} of each month.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                <button onClick={() => { setIncomeToEdit(income); setIsRecurringIncomeModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-500"><Pencil size={18}/></button>
                                <button onClick={() => { setIncomeToDeleteId(income.id); setIsConfirmDeleteIncomeOpen(true); }} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        )) : <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recurring incomes set up.</p>}
                    </div>
                </div>
            </div>
            {isAccountModalOpen && <AddAccountModal onClose={() => setIsAccountModalOpen(false)} onAddAccount={handleAddAccount} />}
            {isRecurringIncomeModalOpen && <AddRecurringIncomeModal onClose={() => setIsRecurringIncomeModalOpen(false)} onAdd={handleAddRecurringIncome} onUpdate={handleUpdateRecurringIncome} incomeToEdit={incomeToEdit} accounts={accounts} />}
            {isConfirmDeleteIncomeOpen && <ConfirmationModal isOpen={isConfirmDeleteIncomeOpen} onClose={() => setIsConfirmDeleteIncomeOpen(false)} onConfirm={handleDeleteRecurringIncome} title="Delete Recurring Income" message="Are you sure you want to delete this recurring income source?" isConfirming={isDeleting} confirmText="Delete" />}
            {isConfirmDeleteAccountOpen && <ConfirmationModal isOpen={isConfirmDeleteAccountOpen} onClose={() => setIsConfirmDeleteAccountOpen(false)} onConfirm={handleConfirmDeleteAccount} title={`Delete "${accountToDelete?.name}"?`} message="This will permanently delete the account and all related transactions. This action cannot be undone." isConfirming={isDeleting} confirmText="Delete Account" />}
        </div>
    );
}

export default AccountsPage;
