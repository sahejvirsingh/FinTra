

import React from 'react';
import GoalCard from './GoalCard';
import { Goal } from '../types';

interface FinancialGoalsProps {
  goals: Goal[];
  currency: string;
  onNavigate?: () => void;
}

const FinancialGoals = ({ goals, currency, onNavigate }: FinancialGoalsProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Goals</h2>
        {onNavigate && (
           <button onClick={onNavigate} className="text-sm font-semibold text-indigo-500 hover:underline">View All</button>
        )}
      </div>
      <div className="flex overflow-x-auto space-x-6 pb-4 -mb-4 -mx-6 px-6" style={{ scrollbarWidth: 'none' }}>
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} currency={currency} />
        ))}
        {goals.length === 0 && <p className="text-gray-500">No financial goals set up yet.</p>}
      </div>
    </div>
  );
};

export default FinancialGoals;