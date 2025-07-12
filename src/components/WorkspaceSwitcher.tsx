import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, PlusCircle, Users, User } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import CreateWorkspaceModal from './modals/CreateWorkspaceModal';

const WorkspaceSwitcher = () => {
    const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const switcherRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const Icon = currentWorkspace.type === 'organization' ? Users : User;

    return (
        <div className="relative h-full flex items-center" ref={switcherRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-left bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <div className="flex items-center truncate">
                    <div className="p-2 bg-gray-700 rounded-md mr-3">
                       <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-white truncate">{currentWorkspace.name}</span>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-2 animate-in fade-in-0 zoom-in-95">
                    {workspaces.map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => { switchWorkspace(ws.id); setIsOpen(false); }}
                            className="w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <div className="flex items-center truncate">
                               {ws.type === 'organization' ? <Users className="w-4 h-4 mr-3"/> : <User className="w-4 h-4 mr-3"/>}
                                <span className="truncate">{ws.name}</span>
                            </div>
                            {ws.id === currentWorkspace.id && <Check className="w-4 h-4 text-indigo-500" />}
                        </button>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                        onClick={() => { setIsModalOpen(true); setIsOpen(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <PlusCircle className="w-4 h-4 mr-3" />
                        Create Workspace
                    </button>
                </div>
            )}
            {isModalOpen && <CreateWorkspaceModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default WorkspaceSwitcher;