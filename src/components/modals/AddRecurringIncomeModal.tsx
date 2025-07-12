

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { RecurringIncome, Account, SupportedCurrencies } from '../../types';
import CustomDropdown from '../shared/CustomDropdown';
import { useUser } from '../../contexts/UserContext';

type RecurringIncomeData = Omit<RecurringIncome, 'id' | 'created_at' | 'user_id' | 'workspace_id'>;

interface AddRecurringIncomeModalProps {
  onClose: () => void;
  onAdd: (data: RecurringIncomeData) => Promise<void>;
  onUpdate: (id: string, data: RecurringIncomeData) => Promise<void>;
  incomeToEdit: RecurringIncome | null;
  accounts: Account[];
}

const AddRecurringIncomeModal = ({ onClose, onAdd, onUpdate, incomeToEdit, accounts }: AddRecurringIncomeModalProps) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = incomeToEdit !== null;
  const { profile } = useUser();
  const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';

  useEffect(() => {
    if (isEditing) {
      setName(incomeToEdit.name);
      setAmount(String(incomeToEdit.amount));
      setDayOfMonth(String(incomeToEdit.day_of_month));
      setAccountId(incomeToEdit.account_id);
      setIsActive(incomeToEdit.is_active);
    }
  }, [incomeToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const day = parseInt(dayOfMonth);
    if (!name || !amount || !dayOfMonth || !accountId || day < 1 || day > 31) {
      setError("Please fill all fields correctly. Day must be between 1 and 31.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const data: RecurringIncomeData = {
      name,
      amount: parseFloat(amount),
      day_of_month: day,
      account_id: accountId,
      is_active: isActive,
    };

    try {
      if (isEditing) {
        await onUpdate(incomeToEdit.id, data);
      } else {
        await onAdd(data);
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed to save: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAccountLabel = (accId: string) => {
    const account = accounts.find(a => a.id === accId);
    return account ? `${account.name} (${account.type})` : 'Select account';
  }

  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'Add'} Recurring Income</h2>
          <button onClick={onClose} disabled={isSubmitting}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div><label htmlFor="name" className={labelClasses}>Income Name *</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="e.g., Monthly Salary" required /></div>
          <div><label htmlFor="account" className={labelClasses}>Deposit to Account *</label><CustomDropdown options={accounts.map(a => a.id)} value={accountId} onChange={setAccountId} placeholder="Select account" getLabel={getAccountLabel}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label htmlFor="amount" className={labelClasses}>Amount *</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span><input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className={`${inputClasses} pl-7`} required /></div></div>
            <div><label htmlFor="dayOfMonth" className={labelClasses}>Day of Month *</label><input type="number" id="dayOfMonth" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className={inputClasses} min="1" max="31" required /></div>
          </div>
          <div className="flex items-center justify-between">
              <label htmlFor="isActive" className={labelClasses}>Active</label>
              <button type="button" onClick={() => setIsActive(!isActive)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}/></button>
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
           <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 ml-4 w-36 h-[42px] flex items-center justify-center">
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecurringIncomeModal;