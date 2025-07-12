
import React from 'react';
import { formatCurrency } from '../../utils/currency';
import { Currency } from '../../types';

interface StatCardProps {
  title: string;
  value: number;
  currency: Currency;
  colorClass: string;
  period?: string;
}

const StatCard = ({ title, value, currency, colorClass, period }: StatCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
        {formatCurrency(value, currency)}
      </p>
      {period && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{period}</p>}
    </div>
  );
};

export default StatCard;
