

import React from 'react';
import { Goal, GoalStatus, iconMap, GoalPayment } from '../types';
import { Info, Calendar, Pencil, Trash2, Repeat, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface GoalCardProps {
  goal: Goal;
  currency: string;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onAddPayment?: (goalId: string) => void;
  onEditPayment?: (payment: GoalPayment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

const statusStyles: { [key in GoalStatus]: { bg: string; text: string; } } = {
  [GoalStatus.Pending]: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  [GoalStatus.InProgress]: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  [GoalStatus.Completed]: { bg: 'bg-green-500/20', text: 'text-green-400' },
};

const GoalCard = ({ goal, currency, onEdit, onDelete, onAddPayment, onEditPayment, onDeletePayment }: GoalCardProps) => {
  const progress = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
  const statusStyle = statusStyles[goal.status];
  const Icon = iconMap[goal.icon_name] || iconMap.default;

  return (
    <div className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            <Info size={14} className="mr-1.5" />
            {goal.status}
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{goal.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10 overflow-hidden">{goal.description}</p>
        
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(goal.target_amount, currency)}<span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2">target</span></p>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          <Calendar size={14} className="mr-2"/>
          Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </div>

        {onAddPayment && (
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button onClick={() => onAddPayment(goal.id)} className="w-full text-center py-2 px-4 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors text-sm">
                    Add Payment Plan
                </button>
                <div className="mt-4 space-y-2 max-h-24 overflow-y-auto">
                    {goal.goal_payments && goal.goal_payments.sort((a,b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                {p.payment_type === 'SIP' ? <Repeat size={12} className="mr-1.5"/> : <ArrowRight size={12} className="mr-1.5"/>}
                                {p.payment_type} on {new Date(p.payment_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                            </div>
                            <div className="flex items-center">
                                <span className="font-semibold text-green-600 dark:text-green-400 mr-2">
                                    +{formatCurrency(p.amount, currency)}
                                </span>
                                {onEditPayment && onDeletePayment && (
                                  <div className="flex items-center">
                                    <button onClick={() => onEditPayment(p)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={12}/></button>
                                    <button onClick={() => onDeletePayment(p.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                                  </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
      
      {onEdit && onDelete && (
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end space-x-2">
            <button onClick={() => onEdit(goal)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Pencil size={18} />
            </button>
            <button onClick={() => onDelete(goal.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Trash2 size={18} />
            </button>
        </div>
      )}
    </div>
  );
};

export default GoalCard;