import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Account, SupportedCurrencies, EmiPayment } from '../../types';
import CustomDropdown from '../shared/CustomDropdown';
import { useUser } from '../../contexts/UserContext';
import { formatCurrency } from '../../utils/currency';

interface AddEmiPaymentModalProps {
  onClose: () => void;
  onSave: (paymentData: Omit<EmiPayment, 'id' | 'created_at' | 'user_id'> & {payment_date: string}) => Promise<void>;
  emiId: string;
  accounts: Account[];
  paymentToEdit: EmiPayment | null;
}

const AddEmiPaymentModal = ({ onClose, onSave, emiId, accounts, paymentToEdit }: AddEmiPaymentModalProps) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentType, setPaymentType] = useState<'One-Time' | 'SIP'>('One-Time');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();
  const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';

  const isEditing = paymentToEdit !== null;

  useEffect(() => {
    if (isEditing) {
        setAmount(String(paymentToEdit.amount));
        setAccountId(paymentToEdit.account_id);
        setPaymentType(paymentToEdit.payment_type);
        setPaymentDate(new Date(paymentToEdit.payment_date).toISOString().split('T')[0]);
    }
  }, [paymentToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !amount) {
      setError("Please select an account and enter an amount.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({
          emi_id: emiId,
          account_id: accountId,
          amount: parseFloat(amount),
          payment_type: paymentType,
          payment_date: paymentDate
      });
    } catch (err) {
      setError(err instanceof Error ? `Failed to save payment: ${err.message}` : 'An unknown error occurred.');
      setIsSubmitting(false);
    }
  };

  const getAccountLabel = (accId: string) => {
    const account = accounts.find(a => a.id === accId);
    return account ? `${account.name} (${formatCurrency(account.balance, profile!.currency)})` : 'Select account';
  }

  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'Add'} EMI Payment</h2>
          <button onClick={onClose} disabled={isSubmitting}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="account" className={labelClasses}>From Account *</label>
            <CustomDropdown options={accounts.map(a => a.id)} value={accountId} onChange={setAccountId} placeholder="Select source account" getLabel={getAccountLabel}/>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className={labelClasses}>Amount *</label>
              <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 dark:text-gray-400">{currencySymbol}</span><input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className={`${inputClasses} pl-8`} placeholder="0.00" required step="0.01" /></div>
            </div>
             <div>
                <label htmlFor="date" className={labelClasses}>Date *</label>
                <input type="date" id="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className={inputClasses} required />
               </div>
           </div>
          <div>
            <label className={labelClasses}>Payment Type *</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setPaymentType('One-Time')} className={`flex-1 p-3 rounded-lg border-2 text-center ${paymentType === 'One-Time' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600'}`}>One-Time</button>
              <button type="button" onClick={() => setPaymentType('SIP')} className={`flex-1 p-3 rounded-lg border-2 text-center ${paymentType === 'SIP' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600'}`}>SIP</button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 ml-4 w-36 h-[42px] flex items-center justify-center">
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmiPaymentModal;