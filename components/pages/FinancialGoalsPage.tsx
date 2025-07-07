



import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Goal, GoalStatus, Account, GoalPayment } from '../../types';
import GoalCard from '../GoalCard';
import AddGoalModal from '../modals/AddGoalModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import AddGoalPaymentModal from '../modals/AddGoalPaymentModal';
import { Database } from '../../lib/database.types';
import WarningBanner from '../shared/WarningBanner';

const FinancialGoalsPage = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const { profile } = useUser();
    const { currentWorkspace } = useWorkspace();

    // Modals state
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
    const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
    const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<GoalPayment | null>(null);
    const [goalForPayment, setGoalForPayment] = useState<string | null>(null);

    const fetchPageData = useCallback(async () => {
        if (!profile || !currentWorkspace.id) return;
        setLoading(true);
        setError(null);
        setDeleteError(null);
        
        try {
            const { data: goalsData, error: goalsError } = await supabase.from('goals').select('*, goal_payments(*)').eq('workspace_id', currentWorkspace.id).order('created_at', { ascending: false });
            if (goalsError) throw new Error(`Goals: ${goalsError.message}`);
            setGoals((goalsData as Goal[]) || []);

            const { data: accountsData, error: accountsError } = await supabase.rpc('get_accounts_for_workspace', { p_workspace_id: currentWorkspace.id });
            if (accountsError) throw new Error(`Accounts: ${accountsError.message}`);
            setAccounts((accountsData as Account[]) || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [profile, currentWorkspace.id]);

    useEffect(() => {
        if (currentWorkspace.id) {
            fetchPageData();
        }
    }, [fetchPageData, currentWorkspace.id]);

    // Goal Management
    const handleAddGoal = async (goalData: Omit<Goal, 'id' | 'created_at' | 'user_id' | 'workspace_id' | 'current_amount' | 'status'>) => {
        if (!currentWorkspace.id || !profile) throw new Error("No workspace or user selected");
        
        const goalDataToInsert: Database['public']['Tables']['goals']['Insert'] = {
            title: goalData.title,
            description: goalData.description,
            target_amount: goalData.target_amount,
            current_amount: 0,
            target_date: goalData.target_date,
            status: GoalStatus.InProgress,
            icon_name: goalData.icon_name,
            workspace_id: currentWorkspace.id,
            user_id: profile.id
        };
        
        const { error } = await supabase.from('goals').insert([goalDataToInsert] as any);
        if (error) throw new Error(error.message);
        await fetchPageData();
        setIsGoalModalOpen(false);
    };

    const handleUpdateGoal = async (goalId: string, goalData: Omit<Goal, 'id' | 'created_at' | 'user_id' | 'workspace_id'>) => {
        const { error } = await supabase.rpc('update_goal', {
            p_goal_id: goalId,
            p_title: goalData.title,
            p_description: goalData.description,
            p_target_amount: goalData.target_amount,
            p_current_amount: goalData.current_amount,
            p_target_date: goalData.target_date,
            p_status: goalData.status,
            p_icon_name: goalData.icon_name
        });
        if (error) throw new Error(error.message);
        await fetchPageData();
        setIsGoalModalOpen(false);
        setGoalToEdit(null);
    };

    const handleDeleteGoalRequest = (goalId: string) => {
        setGoalToDeleteId(goalId);
        setIsConfirmOpen(true);
    };
    
    const handleConfirmDeleteGoal = async () => {
        if (!goalToDeleteId) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { error } = await supabase.rpc('delete_goal', { p_goal_id: goalToDeleteId });
            if (error) throw error;
            await fetchPageData();
        } catch(err) {
            setDeleteError(`Failed to delete goal: ${(err as Error).message}`);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setGoalToDeleteId(null);
        }
    };

    // Payment Management
    const handleAddPaymentRequest = (goalId: string) => {
        setPaymentToEdit(null);
        setGoalForPayment(goalId);
        setIsPaymentModalOpen(true);
    };
    
    const handleEditPaymentRequest = (payment: GoalPayment) => {
        setPaymentToEdit(payment);
        setGoalForPayment(payment.goal_id);
        setIsPaymentModalOpen(true);
    };

    const handleDeletePaymentRequest = (paymentId: string) => {
        setPaymentToDeleteId(paymentId);
        setIsPaymentConfirmOpen(true);
    }
    
    const handleConfirmDeletePayment = async () => {
        if (!paymentToDeleteId) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { error } = await supabase.rpc('delete_goal_payment', { p_payment_id: paymentToDeleteId });
            if(error) throw error;
            await fetchPageData();
        } catch(err) {
            setDeleteError(`Failed to delete payment: ${(err as Error).message}`);
        } finally {
            setIsDeleting(false);
            setIsPaymentConfirmOpen(false);
            setPaymentToDeleteId(null);
        }
    }

    const handleSavePayment = async (paymentData: Omit<GoalPayment, 'id' | 'created_at'|'user_id'|'payment_date'> & {payment_date: string}) => {
        const currentGoal = goals.find(g => g.id === paymentData.goal_id);
        if(!currentGoal || !profile) throw new Error("Goal or profile not found");

        if (paymentToEdit) { // Update
             const { error } = await supabase.rpc('update_goal_payment', { 
                p_payment_id: paymentToEdit.id, 
                p_new_account_id: paymentData.account_id, 
                p_new_amount: paymentData.amount, 
                p_new_payment_type: paymentData.payment_type,
                p_new_date: paymentData.payment_date
            });
            if (error) throw new Error(error.message);
        } else { // Add
             const { error } = await supabase.rpc('add_goal_payment', { 
                p_goal_id: paymentData.goal_id, 
                p_account_id: paymentData.account_id, 
                p_amount: paymentData.amount, 
                p_payment_type: paymentData.payment_type,
                p_date: paymentData.payment_date,
                p_expense_title: `Goal: ${currentGoal.title}`,
                p_user_id: profile.id
            });
            if (error) throw new Error(error.message);
        }
        await fetchPageData(); // Fetch fresh data to ensure UI is consistent
        setIsPaymentModalOpen(false);
        setGoalForPayment(null);
        setPaymentToEdit(null);
    };

    const categorizedGoals = useMemo(() => {
        const board: { [key in GoalStatus]: Goal[] } = { [GoalStatus.Pending]: [], [GoalStatus.InProgress]: [], [GoalStatus.Completed]: [] };
        goals.forEach(goal => { board[goal.status]?.push(goal); });
        return board;
    }, [goals]);

    const statusOrder: GoalStatus[] = [GoalStatus.InProgress, GoalStatus.Pending, GoalStatus.Completed];

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
    }

    if (error) {
        return <div className="text-red-500">Error loading financial goals: {error}</div>;
    }
    
    if (!profile) return <p>Loading...</p>;

    return (
        <div className="max-w-full mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Goals Board</h1>
                <button onClick={() => { setGoalToEdit(null); setIsGoalModalOpen(true);}} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors">
                    <Plus size={16} className="mr-2" /> Add New Goal
                </button>
             </div>
             
             {deleteError && (
                <WarningBanner message={deleteError} onDismiss={() => setDeleteError(null)} />
             )}

             <div className="flex flex-col lg:flex-row gap-6 mt-2">
                {statusOrder.map(status => (
                    <div key={status} className="flex-1 bg-gray-100 dark:bg-gray-800/20 p-4 rounded-xl">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 px-2">{status} ({categorizedGoals[status].length})</h2>
                        <div className="space-y-4">
                            {categorizedGoals[status].map(goal => (
                                 <GoalCard 
                                     key={goal.id} 
                                     goal={goal} 
                                     currency={profile.currency} 
                                     onEdit={() => {setGoalToEdit(goal); setIsGoalModalOpen(true);}}
                                     onDelete={handleDeleteGoalRequest}
                                     onAddPayment={handleAddPaymentRequest}
                                     onEditPayment={handleEditPaymentRequest}
                                     onDeletePayment={handleDeletePaymentRequest}
                                 />
                            ))}
                            {categorizedGoals[status].length === 0 && <p className="text-center text-gray-500 p-4">No goals in this stage.</p>}
                        </div>
                    </div>
                ))}
             </div>

            {isGoalModalOpen && <AddGoalModal goalToEdit={goalToEdit} onClose={() => setIsGoalModalOpen(false)} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal}/>}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDeleteGoal} title="Delete Financial Goal" message="Are you sure you want to delete this goal? This action cannot be undone." isConfirming={isDeleting} confirmText="Delete"/>}
            {isPaymentConfirmOpen && <ConfirmationModal isOpen={isPaymentConfirmOpen} onClose={() => setIsPaymentConfirmOpen(false)} onConfirm={handleConfirmDeletePayment} title="Delete Payment" message="Are you sure you want to delete this payment record?" isConfirming={isDeleting} confirmText="Delete"/>}
            {isPaymentModalOpen && goalForPayment && <AddGoalPaymentModal goalId={goalForPayment} onClose={() => { setIsPaymentModalOpen(false); setPaymentToEdit(null); }} onSave={handleSavePayment} accounts={accounts} paymentToEdit={paymentToEdit}/>}
        </div>
    );
};

export default FinancialGoalsPage;