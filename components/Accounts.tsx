


import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { Account, iconMap, Expense, TopUp, RecurringIncome, SupportedCurrencies, Currency, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/currency';
import WarningBanner from './shared/WarningBanner';

const AccountHealthBar = ({ balance, monthlyIncome, currency }: {
    balance: number;
    monthlyIncome: number;
    currency: string;
}) => {
    if (monthlyIncome <= 0) return null;

    const percentage = Math.max(0, Math.min(100, (balance / monthlyIncome) * 100));
    let barColor = 'bg-green-500';
    if (percentage < 25) barColor = 'bg-red-500';
    else if (percentage < 50) barColor = 'bg-yellow-500';
    
    return (
        <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                    className={`${barColor} h-1.5 rounded-full transition-all duration-300`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
             <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
                <span>{formatCurrency(balance, currency)} of {formatCurrency(monthlyIncome, currency)}</span>
            </div>
        </div>
    );
};


const AccountItem = ({ account, currency, monthlyIncome }: { account: Account, currency: string, monthlyIncome: number }) => {
  const Icon = iconMap[account.icon_name] || iconMap.default;
  return (
    <div className="py-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{account.type}</p>
                </div>
            </div>
            <p className={`font-semibold ${account.balance < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(account.balance, currency)}</p>
        </div>
        <AccountHealthBar balance={account.balance} monthlyIncome={monthlyIncome} currency={currency} />
    </div>
  );
};

interface AccountsProps {
  accounts: Account[];
  expenses: Expense[];
  topups: TopUp[];
  recurringIncomes: RecurringIncome[];
  categoryBudgets: CategoryBudget[];
  onAddAccountClick: () => void;
  onTopUpClick: () => void;
  onRefreshClick: () => void;
  isRefreshing: boolean;
  currency: Currency;
}

const Accounts = ({ accounts, expenses, topups, recurringIncomes, categoryBudgets, onAddAccountClick, onTopUpClick, onRefreshClick, isRefreshing, currency }: AccountsProps) => {
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  
  const checkingAccount = accounts.find(acc => acc.type === 'Checking' || acc.name === 'Checking Account') || accounts[0];

  const {
    monthlySpending,
    totalMonthlyIncome,
    budgetAmount,
    spendingVsBudgetPercentage,
    incomeVsBudgetPercentage,
    progressBarColor,
    budgetExceedsIncome,
    monthlyIncomePerAccount,
   } = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const spending = expenses
      .filter(e => new Date(e.date) >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const incomeFromTopups = topups
        .filter(t => new Date(t.topup_time) >= startOfMonth)
        .reduce((sum, t) => sum + t.amount, 0);

    const incomeMap = new Map<string, number>();
    recurringIncomes.forEach(income => {
        if (income.is_active) {
            incomeMap.set(income.account_id, (incomeMap.get(income.account_id) || 0) + income.amount);
        }
    });

    const incomeFromRecurring = Array.from(incomeMap.values()).reduce((sum, amount) => sum + amount, 0);
    
    const totalIncome = incomeFromTopups + incomeFromRecurring;
    const budget = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
    
    const spendingPercentage = budget > 0 ? Math.min(100, (spending / budget) * 100) : 0;
    const incomePercentage = budget > 0 ? Math.min(100, (totalIncome / budget) * 100) : 0;
    
    let progColor;
    if (spendingPercentage > 80) progColor = 'bg-red-500 dark:bg-red-600';
    else if (spendingPercentage > 50) progColor = 'bg-yellow-500 dark:bg-yellow-600';
    else progColor = 'bg-green-500 dark:bg-green-600';
    
    return { 
        monthlySpending: spending,
        totalMonthlyIncome: totalIncome,
        budgetAmount: budget,
        spendingVsBudgetPercentage: spendingPercentage,
        incomeVsBudgetPercentage: incomePercentage,
        progressBarColor: progColor,
        budgetExceedsIncome: budget > 0 && budget > totalIncome,
        monthlyIncomePerAccount: incomeMap,
    };
  }, [expenses, topups, recurringIncomes, categoryBudgets]);
  
  const currencySymbol = SupportedCurrencies[currency]?.symbol || '$';
  const isBalanceNegative = (checkingAccount?.balance ?? 0) < 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
       {budgetExceedsIncome && !isWarningDismissed && (
        <WarningBanner
            message="Your monthly budget exceeds your expected income. Consider adjusting your budget."
            onDismiss={() => setIsWarningDismissed(true)}
        />
       )}

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Accounts</h2>
      <div className="mb-4">
        <div className="flex items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{checkingAccount?.name || 'Main Account'} Balance</p>
        </div>
        <p className={`text-4xl font-bold ${isBalanceNegative ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(checkingAccount?.balance || 0, currency)}</p>
      </div>

      <div className="mb-6 space-y-2">
         <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between font-medium">
             <span>Spent: {formatCurrency(monthlySpending, currency)}</span>
             <span>Budget: {formatCurrency(budgetAmount, currency)}</span>
        </div>
        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className={`${progressBarColor} h-3 rounded-full transition-all duration-500`} style={{ width: `${spendingVsBudgetPercentage}%` }}></div>
            <div 
                className="absolute top-0 h-full w-1 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full -translate-y-1/3" 
                style={{ left: `calc(${incomeVsBudgetPercentage}% - 2px)`, height: '150%' }}
                title={`Expected Income: ${formatCurrency(totalMonthlyIncome, currency)}`}
            ></div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-end items-center mt-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1.5 border border-white dark:border-gray-800"></div>
            <span>Income Marker</span>
        </div>
      </div>


      <div className="space-y-2 flex-1 overflow-y-auto">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Your Accounts</p>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map(account => <AccountItem key={account.id} account={account} currency={currency} monthlyIncome={monthlyIncomePerAccount.get(account.id) || 0} />)}
        </div>
      </div>
      
      <div className="mt-6 flex items-center space-x-3">
        <button onClick={onRefreshClick} disabled={isRefreshing} className="flex-shrink p-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
        <button onClick={onTopUpClick} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-500 transition-colors flex-grow">
          <TrendingUp size={16} className="mr-2" /> Top-up ({currencySymbol})
        </button>
        <button onClick={onAddAccountClick} className="flex-shrink flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors">
          <Plus size={16} className="mr-2" /> Add
        </button>
      </div>
    </div>
  );
};

export default Accounts;
