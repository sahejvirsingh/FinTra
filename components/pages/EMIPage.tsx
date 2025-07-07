



import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../contexts/UserContext';
import { EMI, Account, EmiPayment } from '../../types';
import AddEmiModal from '../modals/AddEmiModal';
import ConfirmationModal from '../modals/ConfirmationModal';
import EmiCard from '../EmiCard';
import AddEmiPaymentModal from '../modals/AddEmiPaymentModal';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { Database } from '../../lib/database.types';
import WarningBanner from '../shared/WarningBanner';

type EmiStatus = 'Active' | 'Completed';

const EMIPage = () => {
    const [emis, setEmis] = useState<EMI[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const { profile } = useUser();
    const { currentWorkspace } = useWorkspace();


    // Modal state
    const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
    const [emiToDeleteId, setEmiToDeleteId] = useState<string | null>(null);
    const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<EmiPayment | null>(null);
    const [emiForPayment, setEmiForPayment] = useState<string | null>(null);


    const fetchPageData = useCallback(async () => {
        if (!profile || !currentWorkspace.id) return;
        setLoading(true);
        setError(null);
        setDeleteError(null);
        try {
            const { data: emisData, error: emisError } = await supabase.from('emis').select('*, emi_payments(*)').eq('workspace_id', currentWorkspace.id).order('due_date_of_month');
            if (emisError) throw new Error(`EMIs: ${emisError.message}`);
            setEmis((emisData as EMI[]) || []);

            const { data: accountsData, error: accountsError } = await supabase.rpc('get_accounts_for_workspace', { p_workspace_id: currentWorkspace.id });
            if (accountsError) throw new Error(`Accounts: ${accountsError.message}`);
            setAccounts((accountsData as Account[]) || []);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            console.error("Failed to fetch EMI page data:", errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [profile, currentWorkspace.id]);

    useEffect(() => {
        if (currentWorkspace.id) {
           fetchPageData();
        }
    }, [fetchPageData, currentWorkspace.id]);
    
    const categorizedEmis = useMemo(() => {
        const board: { [key in EmiStatus]: EMI[] } = { 'Active': [], 'Completed': [] };
        emis.forEach(emi => {
             const totalPaid = emi.emi_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
             if (totalPaid >= emi.total_amount && emi.total_amount > 0) {
                 board['Completed'].push(emi);
             } else {
                 board['Active'].push(emi);
             }
        });
        return board;
    }, [emis]);

    const handleAddEmi = async (emiData: Omit<EMI, 'id' | 'created_at' | 'user_id' | 'emi_payments' | 'workspace_id'>) => {
        if (!currentWorkspace.id || !profile) throw new Error("No workspace or user selected");
        
        const emiToInsert: Database['public']['Tables']['emis']['Insert'] = {
            name: emiData.name,
            total_amount: emiData.total_amount,
            monthly_payment: emiData.monthly_payment,
            due_date_of_month: emiData.due_date_of_month,
            start_date: emiData.start_date,
            end_date: emiData.end_date,
            workspace_id: currentWorkspace.id,
            user_id: profile.id
        };
        
        const { error } = await supabase.from('emis').insert([emiToInsert] as any);
        if (error) throw new Error(error.message);
        await fetchPageData();
        setIsEmiModalOpen(false);
    };

    const handleDeleteRequest = (id: string) => {
        setEmiToDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!emiToDeleteId) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { error } = await supabase.rpc('delete_emi', { p_emi_id: emiToDeleteId });
            if (error) throw error;
            await fetchPageData();
        } catch(err) {
            setDeleteError(`Error deleting EMI: ${(err as Error).message}`);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setEmiToDeleteId(null);
        }
    };

    const handleAddPaymentRequest = (emiId: string) => {
        setPaymentToEdit(null);
        setEmiForPayment(emiId);
        setIsPaymentModalOpen(true);
    };

    const handleEditPaymentRequest = (payment: EmiPayment) => {
        setPaymentToEdit(payment);
        setEmiForPayment(payment.emi_id);
        setIsPaymentModalOpen(true);
    };

    const handleDeletePaymentRequest = (paymentId: string) => {
        setPaymentToDeleteId(paymentId);
        setIsPaymentConfirmOpen(true);
    };

    const handleConfirmDeletePayment = async () => {
        if (!paymentToDeleteId || !profile) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const { error } = await supabase.rpc('delete_emi_payment', { p_payment_id: paymentToDeleteId });
            if (error) throw error;
            await fetchPageData();
        } catch (err) {
            setDeleteError(`Failed to delete payment: ${(err as Error).message}`);
        } finally {
            setIsDeleting(false);
            setIsPaymentConfirmOpen(false);
            setPaymentToDeleteId(null);
        }
    };

    const handleSavePayment = async (paymentData: Omit<EmiPayment, 'id' | 'created_at'|'user_id'> & {payment_date: string}) => {
        const currentEmi = emis.find(e => e.id === paymentData.emi_id);
        if(!currentEmi || !profile) throw new Error("EMI or profile not found");

        try {
            if (paymentToEdit) { // Update
                await supabase.rpc('update_emi_payment', { 
                    p_payment_id: paymentToEdit.id, 
                    p_new_account_id: paymentData.account_id, 
                    p_new_amount: paymentData.amount, 
                    p_new_payment_type: paymentData.payment_type,
                    p_new_date: paymentData.payment_date
                });
            } else { // Add
                await supabase.rpc('add_emi_payment', { 
                    p_emi_id: paymentData.emi_id, 
                    p_account_id: paymentData.account_id, 
                    p_amount: paymentData.amount, 
                    p_payment_type: paymentData.payment_type,
                    p_date: paymentData.payment_date,
                    p_expense_title: `EMI: ${currentEmi.name}`,
                    p_user_id: profile.id
                });
            }
            await fetchPageData();
            setIsPaymentModalOpen(false);
            setEmiForPayment(null);
            setPaymentToEdit(null);
        } catch (err) {
            throw new Error((err as Error).message);
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
    }

    if (error) {
        return <div className="text-red-500">Error loading EMIs: {error}</div>;
    }

    if (!profile) return <p>Loading...</p>;

    return (
        <div className="max-w-full mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">EMI Board</h1>
                <button onClick={() => setIsEmiModalOpen(true)} className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors">
                    <Plus size={16} className="mr-2" /> Add New EMI
                </button>
             </div>

             {deleteError && (
                <WarningBanner message={deleteError} onDismiss={() => setDeleteError(null)} />
             )}
             
             <div className="space-y-8 mt-2">
                 {(['Active', 'Completed'] as EmiStatus[]).map(status => (
                    <div key={status}>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4 px-2">{status} ({categorizedEmis[status].length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categorizedEmis[status].map(emi => (
                                 <EmiCard 
                                    key={emi.id}
                                    emi={emi} 
                                    currency={profile.currency}
                                    onDelete={handleDeleteRequest}
                                    onAddPayment={handleAddPaymentRequest}
                                    onEditPayment={handleEditPaymentRequest}
                                    onDeletePayment={handleDeletePaymentRequest}
                                />
                            ))}
                        </div>
                        {categorizedEmis[status].length === 0 && <p className="text-center text-gray-500 p-4">No {status.toLowerCase()} EMIs.</p>}
                    </div>
                 ))}
             </div>

            {isEmiModalOpen && <AddEmiModal onClose={() => setIsEmiModalOpen(false)} onAdd={handleAddEmi} />}
            {isConfirmOpen && <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirmDelete} title="Delete EMI" message="Are you sure you want to delete this EMI and all its payment records? This action cannot be undone." isConfirming={isDeleting} confirmText="Delete"/>}
            {isPaymentConfirmOpen && <ConfirmationModal isOpen={isPaymentConfirmOpen} onClose={() => setIsPaymentConfirmOpen(false)} onConfirm={handleConfirmDeletePayment} title="Delete Payment" message="Are you sure you want to delete this payment record?" isConfirming={isDeleting} confirmText="Delete"/>}
            {isPaymentModalOpen && emiForPayment && <AddEmiPaymentModal emiId={emiForPayment} onClose={() => { setIsPaymentModalOpen(false); setPaymentToEdit(null); }} onSave={handleSavePayment} accounts={accounts} paymentToEdit={paymentToEdit}/>}
        </div>
    );
};

export default EMIPage;