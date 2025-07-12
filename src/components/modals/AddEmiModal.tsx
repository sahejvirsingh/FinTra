import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { EMI, SupportedCurrencies } from '../../types';
import { useUser } from '../../contexts/UserContext';

type EmiData = Omit<EMI, 'id' | 'created_at' | 'user_id' | 'workspace_id' | 'emi_payments'>;

interface AddEmiModalProps {
  onAdd: (data: EmiData) => Promise<void>;
  onClose: () => void;
}

const AddEmiModal = ({ onClose, onAdd }: AddEmiModalProps) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUser();
  const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalAmount || !monthlyPayment || !dueDate || !startDate || !endDate) {
      setError("Please fill all fields.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const data: EmiData = {
      name,
      total_amount: parseFloat(totalAmount),
      monthly_payment: parseFloat(monthlyPayment),
      due_date_of_month: parseInt(dueDate),
      start_date: startDate,
      end_date: endDate,
    };
    
    try {
      await onAdd(data);
    } catch(err) {
      setError(err instanceof Error ? `Failed to add EMI: ${err.message}` : 'An unknown error occurred.');
      setIsSubmitting(false);
    }
  };
  
  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New EMI</h2>
          <button onClick={onClose} disabled={isSubmitting}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div><label htmlFor="name" className={labelClasses}>EMI Name *</label><input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="e.g., Car Loan" required /></div>
          <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="totalAmount" className={labelClasses}>Total Amount *</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span><input type="number" id="totalAmount" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className={`${inputClasses} pl-7`} required step="0.01"/></div></div>
              <div><label htmlFor="monthlyPayment" className={labelClasses}>Monthly Payment *</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span><input type="number" id="monthlyPayment" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} className={`${inputClasses} pl-7`} required step="0.01"/></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1"><label htmlFor="dueDate" className={labelClasses}>Due Day of Month *</label><input type="number" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClasses} min="1" max="31" required /></div>
              <div className="md:col-span-1"><label htmlFor="startDate" className={labelClasses}>Start Date *</label><input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClasses} required /></div>
              <div className="md:col-span-1"><label htmlFor="endDate" className={labelClasses}>End Date *</label><input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClasses} required /></div>
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
           <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 ml-4 w-36 h-[42px] flex items-center justify-center">
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Save EMI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmiModal;