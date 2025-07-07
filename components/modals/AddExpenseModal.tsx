

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { X, Upload, Plus, Trash2, Loader2 } from 'lucide-react';
import { Expense, ExpenseItem, ExpenseCategories, Account, SupportedCurrencies, RecurringIncome } from '../../types';
import { extractDetailsFromReceipt } from '../../services/geminiService';
import CustomDropdown from '../shared/CustomDropdown';
import { useUser } from '../../contexts/UserContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { formatCurrency } from '../../utils/currency';

export type NewExpenseData = Omit<Expense, 'id' | 'created_at' | 'expense_items' | 'user_id' | 'workspace_id'> & {
  items: Omit<ExpenseItem, 'id'>[];
};

interface AddExpenseModalProps {
  onClose: () => void;
  onAddExpense: (expense: NewExpenseData) => Promise<void>;
  onUpdateExpense: (expenseId: string, expense: NewExpenseData) => Promise<void>;
  expenseToEdit: Expense | null;
  accounts: Account[];
  recurringIncomes: RecurringIncome[];
  defaultAccountId: string | null;
  receiptFile?: File | null;
  onClearReceiptFile?: () => void;
}

const AddExpenseModal = ({ onClose, onAddExpense, onUpdateExpense, expenseToEdit, accounts, recurringIncomes, defaultAccountId, receiptFile, onClearReceiptFile }: AddExpenseModalProps) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Omit<ExpenseItem, 'id'>[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptProcessed, setReceiptProcessed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = expenseToEdit !== null;
  const { profile } = useUser();
  const { currentWorkspace } = useWorkspace();
  const currencySymbol = profile ? SupportedCurrencies[profile.currency].symbol : '$';
  const currencyCode = profile ? profile.currency : 'USD';

  useEffect(() => {
    if (isEditing) {
      setTitle(expenseToEdit.title);
      setAmount(String(expenseToEdit.amount));
      setDate(expenseToEdit.date.split('T')[0]);
      setTime(expenseToEdit.time || '');
      setDescription(expenseToEdit.description || '');
      setItems(expenseToEdit.expense_items?.map(({id, expense_id, created_at, ...item}) => item) || []);
      setAccountId(expenseToEdit.account_id || '');
      
      const isStandardCategory = ExpenseCategories.includes(expenseToEdit.category);
      if (isStandardCategory) {
        setCategory(expenseToEdit.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(expenseToEdit.category);
      }
    } else {
        // Set default account for new expenses
        if (defaultAccountId) {
            setAccountId(defaultAccountId);
        } else if (accounts.length > 0) {
            const checking = accounts.find(acc => acc.type === 'Checking' || acc.name === 'Checking Account');
            setAccountId(checking ? checking.id : accounts[0].id);
        }
    }
  }, [expenseToEdit, isEditing, accounts, defaultAccountId]);

  const handleAddItem = () => {
    setItems([...items, { name: '', price: 0, quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: keyof Omit<ExpenseItem, 'id'>, value: string | number) => {
    setItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };
  
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'Other' ? customCategory : category;
    if (!title || !amount || !finalCategory || !date || !accountId) {
      setError("Please fill all required fields, including the account.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    const expenseData: NewExpenseData = {
      title,
      amount: parseFloat(amount),
      category: finalCategory,
      date,
      time,
      description,
      items,
      account_id: accountId,
    };

    try {
      if (isEditing) {
        await onUpdateExpense(expenseToEdit.id, expenseData);
      } else {
        await onAddExpense(expenseData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? `Failed to save expense: ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processFile = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);

    setIsAiProcessing(true);
    setError(null);
    try {
      const base64Image = await fileToBase64(file);
      const extractedDetails = await extractDetailsFromReceipt(base64Image);
      
      if (extractedDetails) {
        if (extractedDetails.title) setTitle(extractedDetails.title);
        if (extractedDetails.amount) setAmount(String(extractedDetails.amount));
        if (extractedDetails.category) {
            const matchedCategory = ExpenseCategories.find(c => c.toLowerCase() === extractedDetails.category.toLowerCase());
            if (matchedCategory) {
                setCategory(matchedCategory);
                setCustomCategory('');
            } else {
                setCategory('Other');
                setCustomCategory(extractedDetails.category);
            }
        }
        if (extractedDetails.date) setDate(extractedDetails.date);
        if (extractedDetails.time) setTime(extractedDetails.time);
        if (extractedDetails.description) setDescription(extractedDetails.description);
        if (extractedDetails.items) setItems(extractedDetails.items.map(item => ({name: item.name, price: item.price, quantity: item.quantity || 1})));
      } else {
         setError("Could not extract details. Please enter manually.");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to process receipt. Please try again.");
    } finally {
      setIsAiProcessing(false);
      setReceiptProcessed(true);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onClearReceiptFile) {
        onClearReceiptFile();
      }
    }
  }, [onClearReceiptFile]);

  useEffect(() => {
    if (receiptFile) {
      processFile(receiptFile);
    }
  }, [receiptFile, processFile]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if(newCategory !== 'Other') {
        setCustomCategory('');
    }
  }
  
  const accountOptions = accounts.map(acc => acc.id);
  const getAccountLabel = (accId: string) => {
    const account = accounts.find(a => a.id === accId);
    return account ? `${account.name} (${account.type})` : 'Select account';
  }

  const anyLoading = isAiProcessing || isSubmitting;

  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";
  const itemInputClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none";

  const { selectedAccount, monthlyIncome, currentBalance, newBalance, originalPercentage, newPercentage } = useMemo(() => {
    const selAcct = accounts.find(a => a.id === accountId);
    if (!selAcct) return { selectedAccount: null, monthlyIncome: 0, currentBalance: 0, newBalance: 0, originalPercentage: 0, newPercentage: 0};

    const income = recurringIncomes
        .filter(i => i.account_id === accountId && i.is_active)
        .reduce((sum, i) => sum + i.amount, 0);
    
    const bal = selAcct.balance;
    const expenseAmount = parseFloat(amount) || 0;
    const newBal = bal - expenseAmount;
    const origPercent = income > 0 ? Math.max(0, Math.min(100, (bal / income) * 100)) : 0;
    const newPercent = income > 0 ? Math.max(0, Math.min(100, (newBal / income) * 100)) : 0;

    return {
        selectedAccount: selAcct,
        monthlyIncome: income,
        currentBalance: bal,
        newBalance: newBal,
        originalPercentage: origPercent,
        newPercentage: newPercent,
    }

  }, [accountId, accounts, recurringIncomes, amount]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" disabled={anyLoading}>
            <X size={24} />
          </button>
        </div>
        
        <form id="add-expense-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isEditing && (
            <div>
                {receiptPreview && (
                    <div className="mb-4 text-center">
                        <img src={receiptPreview} alt="Receipt Preview" className="max-h-40 w-auto mx-auto rounded-lg shadow-md" />
                    </div>
                )}
                {!receiptProcessed && (
                <>
                    <label className={`${labelClasses}`}>Receipt (Optional)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} disabled={anyLoading} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={anyLoading} className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAiProcessing ? (
                        <>
                        <Loader2 size={24} className="animate-spin mb-2" />
                        <span className="font-semibold text-sm">Processing receipt...</span>
                        </>
                    ) : (
                        <>
                        <Upload size={24} className="mb-2" />
                        <span className="font-semibold text-sm">Upload receipt to auto-fill details</span>
                        </>
                    )}
                    </button>
                </>
                )}
            </div>
          )}
          
          <div>
              <label htmlFor="account" className={labelClasses}>Account *</label>
              <CustomDropdown
                options={accountOptions}
                value={accountId}
                onChange={setAccountId}
                placeholder="Select account"
                getLabel={getAccountLabel}
              />
            </div>
            
            {selectedAccount && monthlyIncome > 0 && (
                <div className="space-y-2">
                    <label className={labelClasses}>Balance Preview (vs. Monthly Income)</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                         <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 relative overflow-hidden">
                            <div
                                className="bg-green-500 h-4 rounded-l-full transition-all duration-300"
                                style={{ width: `${newPercentage}%` }}
                            />
                             {originalPercentage > newPercentage && (
                                <div
                                    className="bg-red-500/80 h-4 absolute top-0 transition-all duration-300"
                                    style={{ 
                                        width: `${originalPercentage - newPercentage}%`, 
                                        left: `${newPercentage}%`,
                                    }}
                                />
                             )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                             <span>Balance After: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(newBalance, currencyCode)}</span></span>
                             <span>vs. Income: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(monthlyIncome, currencyCode)}</span></span>
                        </div>
                    </div>
                </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className={labelClasses}>Title *</label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} placeholder="e.g., Walmart - Groceries" required />
            </div>
            
            <div>
              <label htmlFor="amount" className={labelClasses}>Amount *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">{currencySymbol}</span>
                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className={`${inputClasses} pl-8`} placeholder="0.00" required step="0.01" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="category" className={labelClasses}>Category *</label>
               <CustomDropdown 
                 options={ExpenseCategories}
                 value={category}
                 onChange={handleCategoryChange}
                 placeholder="Select category"
               />
            </div>
             {category === 'Other' && (
                <div className="md:col-span-2">
                    <label htmlFor="customCategory" className={labelClasses}>Custom Category *</label>
                    <input type="text" id="customCategory" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className={inputClasses} placeholder="e.g., Pet Supplies" required />
                </div>
             )}
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
               <div>
                <label htmlFor="date" className={labelClasses}>Date *</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required />
               </div>
               <div>
                 <label htmlFor="time" className={labelClasses}>Time</label>
                 <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className={inputClasses} />
               </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className={labelClasses}>Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses} placeholder="Optional description..."></textarea>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className={labelClasses}>Items Purchased</h3>
                <button type="button" onClick={handleAddItem} className="flex items-center text-sm font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                    <Plus size={16} className="mr-1" /> Add Item
                </button>
            </div>
             <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-[1fr,90px,90px,auto] gap-3 items-center">
                        <input type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} className={itemInputClasses} placeholder="Item Name"/>
                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)} className={itemInputClasses} placeholder="Qty" min="1"/>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{currencySymbol}</span>
                           <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} className={`${itemInputClasses} pl-7`} placeholder="Price" step="0.01"/>
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-400"><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>
          </div>
        
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        </form>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button onClick={onClose} disabled={anyLoading} className="px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button type="submit" form="add-expense-form" disabled={anyLoading} className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors ml-4 w-36 h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Add Expense')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;