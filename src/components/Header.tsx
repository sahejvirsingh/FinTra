

import React from 'react';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import UserMenu from './UserMenu';
import { Page } from '../types';

interface HeaderProps {
    onMenuClick: () => void;
    currentPage: string;
    onNavigate: (page: Page) => void;
}

const pageTitles: {[key: string]: string} = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    transactions: 'All Transactions',
    financial_goals: 'Financial Goals',
    accounts: 'Accounts Hub',
    emi: 'EMI Board',
    settings: 'Settings',
    add_people: 'Manage Members'
}

const Header = ({ onMenuClick, currentPage, onNavigate }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between p-4 h-20">
         <div className="flex items-center">
            <button onClick={onMenuClick} className="p-2 mr-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
                <Menu size={24}/>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">{pageTitles[currentPage] || 'Dashboard'}</h1>
         </div>
        <div className="flex items-center space-x-2 sm:space-x-5">
           <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
             <Bell size={22} />
           </button>
           <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors">
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
           <UserMenu onNavigate={onNavigate} />
        </div>
      </div>
    </header>
  );
};

export default Header;