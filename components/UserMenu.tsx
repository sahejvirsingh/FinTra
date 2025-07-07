
import React, { useState, useRef, useEffect } from 'react';
import { useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import { ChevronDown, LogOut, Edit } from 'lucide-react';
import { Page } from '../types';

interface UserMenuProps {
    onNavigate: (page: Page) => void;
}

const UserMenu = ({ onNavigate }: UserMenuProps) => {
    const { user } = useClerkUser();
    const { signOut } = useClerk();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={user.imageUrl}
                    alt="User avatar"
                />
                <span className="hidden sm:inline font-semibold text-sm text-gray-700 dark:text-gray-200">{user.fullName}</span>
                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                    </div>
                     <button
                        onClick={() => { onNavigate('settings'); setIsOpen(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Edit size={14} className="mr-3" />
                        Edit Profile 
                    </button>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
                    >
                        <LogOut size={14} className="mr-3" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;