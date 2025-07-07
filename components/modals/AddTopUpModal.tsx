

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TopUp, Account, SupportedCurrencies } from '../../types';
import CustomDropdown from '../shared/CustomDropdown';
import { useUser } from '../../contexts/UserContext';

type NewTopUpData = Omit<TopUp, 'id' | 'created_at' | 'user_id' | 'workspace_id'>;

interface AddTopUpModalProps {
  onClose: () => void;
  onAddTopUp: (topUp: NewTopUpData) => Promise<void>;
  onUpdateTopUp: (id: string, topUp: NewTopUpData) => Promise<void>;
  topUpToEdit: TopUp | null;
  accounts: Account[];
}

const AddTopUpModal = ({ onClose, onAddTopUp, onUpdateTopUp, topUpToEdit, accounts }: AddTopUpModalProps) => {
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();
  const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';

  const isEditing = topUpToEdit !== null;

  useEffect(() => {
    if (isEditing) {
        setAccountId(topUpToEdit.account_id);
        setAmount(String(topUpToEdit.amount));
        setName(topUpToEdit.name);
        setDescription(topUpToEdit.description || '');
        setDate(new Date(topUpToEdit.topup_time).toISOString().split('T')[0]);
    }
  }, [topUpToEdit, isEditing]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !amount || !name || !date) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const topUpData = {
        account_id: accountId,
        amount: parseFloat(amount),
        name,
        description,
        topup_time: new Date(date).toISOString(),
    };
    try {
      if (isEditing) {
        await onUpdateTopUp(topUpToEdit.id, topUpData);
      } else {
        await onAddTopUp(topUpData);
      }
    } catch (err) {
      let errorMessage = 'An unknown error occurred.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = `Failed to save top-up: ${String((err as any).message)}`;
      }
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.map(acc => acc.id);
  const accountLabels: {[key: string]: string} = accounts.reduce((acc, current) => {
      acc[current.id] = `${current.name} (${current.type})`;
      return acc;
  }, {} as {[key: string]: string});
  
  const handleAccountChange = (value: string) => {
    const selectedAccount = accounts.find(acc => acc.id === value);
    if(selectedAccount) {
        setAccountId(selectedAccount.id);
    }
  }

  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";
  
  const getDropdownLabel = (value: string) => {
    return accountLabels[value] || 'Select account';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'Add'} Top-Up / Income</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" id="add-topup-form">
          <div>
            <label htmlFor="account" className={labelClasses}>Account *</label>
            <CustomDropdown
              options={accountOptions}
              value={accountId}
              onChange={handleAccountChange}
              placeholder="Select account"
              getLabel={getDropdownLabel}
            />
          </div>

          <div>
            <label htmlFor="name" className={labelClasses}>Name / Title *</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="e.g., Monthly Salary" required />
          </div>

          <div>
            <label htmlFor="amount" className={labelClasses}>Amount *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 dark:text-gray-400">{currencySymbol}</span>
              <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className={`${inputClasses} pl-8`} placeholder="0.00" required step="0.01" />
            </div>
          </div>

           <div>
            <label htmlFor="date" className={labelClasses}>Date *</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required />
           </div>

           <div>
            <label htmlFor="description" className={labelClasses}>Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} placeholder="Optional description... (e.g., from freelancing gig)"></textarea>
          </div>
        
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        </form>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button type="submit" form="add-topup-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors ml-4 w-36 h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Add Top-Up')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTopUpModal;