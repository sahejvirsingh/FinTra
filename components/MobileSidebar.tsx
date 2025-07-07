


import React from 'react';
import {
    BarChart2,
    CreditCard,
    HelpCircle,
    LayoutDashboard,
    ReceiptText,
    Settings,
    LogOut,
    Target,
    X,
    CalendarClock,
    Users,
    ClipboardList
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { Page } from '../types';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    page: Page;
    active: boolean;
    onNavigate: (page: Page) => void;
}

const NavItem = ({ icon, label, page, active, onNavigate }: NavItemProps) => (
    <button
        onClick={() => onNavigate(page)}
        className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ease-in-out transform ${
            active
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-4">{label}</span>
    </button>
);

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

const MobileSidebar = ({ isOpen, onClose, currentPage, onNavigate }: MobileSidebarProps) => {
    const { signOut } = useUser();
    const { currentWorkspace, currentUserRole } = useWorkspace();

    const isOrgAdmin = currentWorkspace.type === 'organization' && currentUserRole === 'admin';
    const showFinancialFeatures = currentWorkspace.type === 'personal';
    
    const handleLogout = async () => {
        await signOut();
        onClose();
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            ></div>
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40 transform transition-transform lg:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between h-20 px-4 border-b border-gray-800">
                    <div className="flex items-center text-white">
                        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 17.95l-2.12-2.12m0 0l-2.122-2.122M12 17.95l2.12-2.12m0 0l2.122-2.122M12 17.95V21"></path></svg>
                        <span className="ml-2 text-xl font-bold">FinTra</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                    <nav className="flex-1 px-4 py-6 space-y-4">
                        <div>
                            <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Overview</h3>
                            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" page="dashboard" active={currentPage === 'dashboard'} onNavigate={onNavigate} />
                            <NavItem icon={<BarChart2 size={20} />} label="Analytics" page="analytics" active={currentPage === 'analytics'} onNavigate={onNavigate} />
                            <NavItem icon={<ReceiptText size={20} />} label="Transactions" page="transactions" active={currentPage === 'transactions'} onNavigate={onNavigate} />
                            {showFinancialFeatures && <NavItem icon={<Target size={20} />} label="Financial Goals" page="financial_goals" active={currentPage === 'financial_goals'} onNavigate={onNavigate} />}
                        </div>
                        <div>
                            <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Finance</h3>
                            <NavItem icon={<CreditCard size={20} />} label="Accounts" page="accounts" active={currentPage === 'accounts'} onNavigate={onNavigate} />
                            {showFinancialFeatures && <NavItem icon={<ClipboardList size={20} />} label="Budgeting" page="budgeting" active={currentPage === 'budgeting'} onNavigate={onNavigate} />}
                            {showFinancialFeatures && <NavItem icon={<CalendarClock size={20} />} label="EMIs" page="emi" active={currentPage === 'emi'} onNavigate={onNavigate} />}
                        </div>
                        {isOrgAdmin && (
                            <div>
                                <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Organization</h3>
                                <NavItem icon={<Users size={20} />} label="Add People" page="add_people" active={currentPage === 'add_people'} onNavigate={onNavigate} />
                            </div>
                        )}
                    </nav>
                    <div className="px-4 py-6 space-y-2 border-t border-gray-800">
                        <NavItem icon={<Settings size={20} />} label="Settings" page="settings" active={currentPage === 'settings'} onNavigate={onNavigate} />
                        <NavItem icon={<HelpCircle size={20} />} label="Help" page="help" active={currentPage === 'help'} onNavigate={onNavigate} />
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-base font-medium rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <LogOut size={20} />
                            <span className="ml-4">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileSidebar;
