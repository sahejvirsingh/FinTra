


import React, { useState } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './components/pages/DashboardPage';
import SettingsPage from './components/pages/SettingsPage';
import FinancialGoalsPage from './components/pages/FinancialGoalsPage';
import TransactionsPage from './components/pages/TransactionsPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import EMIPage from './components/pages/EMIPage';
import { Loader2 } from 'lucide-react';
import MobileSidebar from './components/MobileSidebar';
import AccountsPage from './components/pages/AccountsPage';
import AddPeoplePage from './components/pages/AddPeoplePage';
import BudgetingPage from './components/pages/BudgetingPage';
import { useUser } from './contexts/UserContext';
import { useWorkspace } from './contexts/WorkspaceContext';
import { useTheme } from './hooks/useTheme';
import { Page } from './types';

const App = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  const { loading: workspaceLoading, error: workspaceError } = useWorkspace();
  const { theme } = useTheme();

  if (!isLoaded || (isSignedIn && (profileLoading || workspaceLoading))) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <Loader2 size={48} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        {workspaceError ? (
            <div className="flex items-center justify-center h-screen bg-red-50 dark:bg-gray-900 text-red-700 dark:text-red-300">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg mx-auto">
                    <h2 className="text-2xl font-bold mb-3">Workspace Initialization Failed</h2>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">The application could not load your workspaces. This usually happens when the required database tables and functions are missing.</p>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md text-left text-sm font-mono text-red-500 overflow-x-auto">
                      {workspaceError}
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Please run the SQL script for setting up workspaces in your Supabase project's SQL Editor and then refresh this page.</p>
                </div>
              </div>
        ) : profile ? (
          <MainApplication />
        ) : (
          <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
            <Loader2 size={48} className="animate-spin text-indigo-500" />
            <p className="ml-4 text-gray-500 dark:text-gray-400">Finalizing profile setup...</p>
          </div>
        )}
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
          <SignIn 
            appearance={{
              baseTheme: theme === 'dark' ? dark : undefined,
              elements: {
                card: 'shadow-2xl rounded-2xl border-gray-200 dark:border-gray-700',
              }
            }}
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>
      </SignedOut>
    </>
  );
};

const MainApplication = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'financial_goals':
        return <FinancialGoalsPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'budgeting':
        return <BudgetingPage />;
      case 'settings':
        return <SettingsPage />;
      case 'emi':
        return <EMIPage />;
       case 'add_people':
        return <AddPeoplePage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
      <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} currentPage={currentPage} onNavigate={handleNavigate} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} currentPage={currentPage} onNavigate={handleNavigate} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
            {renderPage()}
          </main>
        </div>
      </div>
  );
}

export default App;
