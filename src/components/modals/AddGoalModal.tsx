

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Goal, GoalStatus, iconMap } from '../../types';
import CustomDropdown from '../shared/CustomDropdown';

type GoalData = Omit<Goal, 'id' | 'created_at' | 'user_id' | 'workspace_id'>;

interface AddGoalModalProps {
  onClose: () => void;
  onAddGoal: (goalData: Omit<Goal, 'id' | 'created_at' | 'user_id' | 'workspace_id' | 'current_amount' | 'status'>) => Promise<void>;
  onUpdateGoal: (goalId: string, goalData: GoalData) => Promise<void>;
  goalToEdit: Goal | null;
}

const AddGoalModal = ({ onClose, onAddGoal, onUpdateGoal, goalToEdit }: AddGoalModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<GoalStatus>(GoalStatus.InProgress);
  const [iconName, setIconName] = useState('Briefcase');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = goalToEdit !== null;

  useEffect(() => {
    if (isEditing) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description);
      setTargetAmount(String(goalToEdit.target_amount));
      setCurrentAmount(String(goalToEdit.current_amount));
      setTargetDate(new Date(goalToEdit.target_date).toISOString().split('T')[0]);
      setStatus(goalToEdit.status);
      setIconName(goalToEdit.icon_name);
    }
  }, [goalToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !currentAmount || !targetDate) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    const goalData: GoalData = {
      title,
      description,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount),
      target_date: targetDate,
      status,
      icon_name: iconName,
    };

    try {
      if (isEditing) {
        await onUpdateGoal(goalToEdit.id, goalData);
      } else {
        await onAddGoal(goalData);
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed to save goal: ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Goal' : 'Add New Goal'}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" id="add-goal-form">
          <div>
            <label htmlFor="title" className={labelClasses}>Goal Title *</label>
            <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
          </div>
          <div>
            <label htmlFor="description" className={labelClasses}>Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentAmount" className={labelClasses}>Current Amount *</label>
              <input type="number" id="currentAmount" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className={inputClasses} required step="0.01"/>
            </div>
            <div>
              <label htmlFor="targetAmount" className={labelClasses}>Target Amount *</label>
              <input type="number" id="targetAmount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className={inputClasses} required step="0.01"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetDate" className={labelClasses}>Target Date *</label>
              <input type="date" id="targetDate" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={inputClasses} required />
            </div>
            <div>
              <label htmlFor="status" className={labelClasses}>Status</label>
              <CustomDropdown
                options={Object.values(GoalStatus)}
                value={status}
                onChange={(val) => setStatus(val as GoalStatus)}
                placeholder="Select Status"
              />
            </div>
          </div>
          <div>
              <label className={labelClasses}>Icon</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(iconMap).filter(key => key !== 'default').map(key => {
                    const Icon = iconMap[key];
                    return (
                        <button 
                          key={key} 
                          type="button" 
                          onClick={() => setIconName(key)}
                          className={`p-3 rounded-lg border-2 ${iconName === key ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600'}`}
                        >
                            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-200"/>
                        </button>
                    )
                })}
              </div>
          </div>
        
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </form>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">Cancel</button>
          <button type="submit" form="add-goal-form" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors ml-4 w-36 h-[42px] flex items-center justify-center disabled:opacity-50">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Add Goal')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGoalModal;