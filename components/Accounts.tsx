import React from "react";
import { Plus, RefreshCw, TrendingUp } from "lucide-react";
import { Account, iconMap, Currency } from "@/types";
import { formatCurrency } from "@/utils/currency";

const AccountItem = ({
  account,
  currency,
}: {
  account: Account;
  currency: string;
}) => {
  const Icon = iconMap[account.icon_name] || iconMap.default;
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900 dark:text-white">
              {account.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {account.type}
            </p>
          </div>
        </div>
        <p
          className={`font-semibold ${
            account.balance < 0
              ? "text-red-500 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {formatCurrency(account.balance, currency)}
        </p>
      </div>
    </div>
  );
};

interface AccountsProps {
  accounts: Account[];
  onAddAccountClick: () => void;
  onTopUpClick: () => void;
  onRefreshClick: () => void;
  isRefreshing: boolean;
  currency: Currency;
}

const Accounts = ({
  accounts,
  onAddAccountClick,
  onTopUpClick,
  onRefreshClick,
  isRefreshing,
  currency,
}: AccountsProps) => {
  const currencySymbol = "€"; // Hardcoded for now, should come from context

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Accounts
      </h2>

      <div className="space-y-2 flex-1 overflow-y-auto -mx-2 px-2">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {accounts.map((account) => (
            <AccountItem
              key={account.id}
              account={account}
              currency={currency}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center space-x-3">
        <button
          onClick={onRefreshClick}
          disabled={isRefreshing}
          className="flex-shrink p-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={onTopUpClick}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-500 transition-colors flex-grow"
        >
          <TrendingUp size={16} className="mr-2" /> Top-up
        </button>
        <button
          onClick={onAddAccountClick}
          className="flex-shrink flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} className="mr-2" /> Add
        </button>
      </div>
    </div>
  );
};

export default Accounts;
