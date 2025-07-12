import React, { useMemo } from 'react';
import { EMI, EmiPayment } from '../types';
import { CalendarClock, Trash2, ArrowRight, Repeat, Pencil } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface EmiCardProps {
  emi: EMI;
  currency: string;
  onDelete: (emiId: string) => void;
  onAddPayment: (emiId: string) => void;
  onEditPayment: (payment: EmiPayment) => void;
  onDeletePayment: (paymentId: string) => void;
}

const EmiCard = ({ emi, currency, onDelete, onAddPayment, onEditPayment, onDeletePayment }: EmiCardProps) => {
  const totalPaid = useMemo(() => {
    return emi.emi_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  }, [emi.emi_payments]);

  const progress = emi.total_amount > 0 ? Math.min(100, (totalPaid / emi.total_amount) * 100) : 0;
  const isCompleted = progress >= 100;

  return (
    <div className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <CalendarClock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
           <p className="text-sm text-gray-500 dark:text-gray-400">Due on day {emi.due_date_of_month}</p>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{emi.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Monthly: {formatCurrency(emi.monthly_payment, currency)}
        </p>
        
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Paid</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPaid, currency)}<span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2"> of {formatCurrency(emi.total_amount, currency)}</span></p>

        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button 
              onClick={() => onAddPayment(emi.id)} 
              className="w-full text-center py-2 px-4 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCompleted}
            >
                Add Payment Plan
            </button>
            <div className="mt-4 space-y-2 max-h-24 overflow-y-auto">
                {emi.emi_payments && emi.emi_payments.sort((a,b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                           {p.payment_type === 'SIP' ? <Repeat size={12} className="mr-1.5"/> : <ArrowRight size={12} className="mr-1.5"/>}
                            {p.payment_type} on {new Date(p.payment_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                        </div>
                        <div className="flex items-center">
                            <span className="font-semibold text-green-600 dark:text-green-400 mr-2">
                                +{formatCurrency(p.amount, currency)}
                            </span>
                            <div className="flex items-center">
                              <button onClick={() => onEditPayment(p)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={12}/></button>
                              <button onClick={() => onDeletePayment(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end">
          <button onClick={() => onDelete(emi.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Trash2 size={18} />
          </button>
      </div>
    </div>
  );
};

export default EmiCard;