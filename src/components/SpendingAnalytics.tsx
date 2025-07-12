

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { Expense, ExpenseCategories } from '../types';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency } from '../utils/currency';

interface SpendingAnalyticsProps {
  expenses: Expense[];
  currency: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SpendingAnalytics = ({ expenses, currency }: SpendingAnalyticsProps) => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  
  const { totalSpent, topCategory, categoryData } = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const spendingByCategory: { [key: string]: number } = {};
    for (const category of ExpenseCategories) {
      spendingByCategory[category] = 0;
    }

    expenses.forEach(exp => {
      if (spendingByCategory.hasOwnProperty(exp.category)) {
        spendingByCategory[exp.category] += exp.amount;
      } else {
        spendingByCategory['Other'] += exp.amount;
      }
    });

    const topCat = Object.entries(spendingByCategory).reduce(
      (top, [name, spent]) => (spent > top.spent ? { name, spent } : top),
      { name: 'N/A', spent: 0 }
    );
    
    const chartData = Object.entries(spendingByCategory)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return { totalSpent: total, topCategory: topCat, categoryData: chartData };
  }, [expenses]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Analytics</h2>
        <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowUpRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpent, currency)}</p>
          <p className="text-xs text-gray-500">Across {categoryData.length} categories</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top Category</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{topCategory.name}</p>
          <p className="text-xs text-gray-500">{formatCurrency(topCategory.spent, currency)} spent</p>
        </div>
      </div>
      
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            {categoryData.length > 0 ? (
                <BarChart data={categoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value), currency)} />
                    <Tooltip 
                      cursor={{fill: 'rgba(107, 114, 128, 0.2)'}}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', 
                        border: '1px solid #4b5563', 
                        borderRadius: '0.5rem' 
                      }} 
                      labelStyle={{ color: theme === 'dark' ? '#d1d5db' : '#111827' }}
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                       {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Bar>
                </BarChart>
            ) : (
                 <div className="flex items-center justify-center h-full text-gray-500">No spending data available.</div>
            )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendingAnalytics;