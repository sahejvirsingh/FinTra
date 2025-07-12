

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { User, Mail, Plus, Loader2, MoreVertical, Trash2, Shield, UserCheck, Check } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { OrganizationMember } from '../../types';
import ConfirmationModal from '../modals/ConfirmationModal';

const MemberActions = ({ member, onRoleChange, onRemove }: { member: OrganizationMember; onRoleChange: (role: 'admin' | 'member') => void; onRemove: () => void; }) => {
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
    
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                <MoreVertical size={18} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-10 p-2">
                    <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Change Role</p>
                    <button onClick={() => { onRoleChange('admin'); setIsOpen(false); }} className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${member.role === 'admin' ? 'font-semibold text-indigo-600' : ''}`}>
                       <span className="flex items-center"><Shield size={14} className="mr-2"/> Admin</span>
                       {member.role === 'admin' && <Check size={16}/>}
                    </button>
                    <button onClick={() => { onRoleChange('member'); setIsOpen(false); }} className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${member.role === 'member' ? 'font-semibold text-indigo-600' : ''}`}>
                       <span className="flex items-center"><UserCheck size={14} className="mr-2"/> Member</span>
                       {member.role === 'member' && <Check size={16}/>}
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button onClick={() => { onRemove(); setIsOpen(false); }} className="w-full text-left flex items-center px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40">
                       <Trash2 size={14} className="mr-2"/> Remove Member
                    </button>
                </div>
            )}
        </div>
    )
};


const AddPeoplePage = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const { members, addMember, updateMemberRole, removeMember, currentWorkspace, fetchMembers } = useWorkspace();
    const { profile } = useUser();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // State for confirmation modals
    const [isConfirming, setIsConfirming] = useState(false);
    const [itemToConfirm, setItemToConfirm] = useState<{ action: 'role' | 'remove'; member: OrganizationMember; newRole?: 'admin' | 'member' } | null>(null);

    useEffect(() => {
        if (refreshTrigger > 0 && currentWorkspace.type === 'organization') {
            fetchMembers();
        }
    }, [refreshTrigger, fetchMembers, currentWorkspace.type]);


    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubmitting(true);
            setError('');
            try {
                await addMember(email);
                setEmail('');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to add member.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleRoleChangeRequest = (member: OrganizationMember, newRole: 'admin' | 'member') => {
        if (member.role === newRole) return; // No change
        setItemToConfirm({ action: 'role', member, newRole });
    };

    const handleRemoveRequest = (member: OrganizationMember) => {
        setItemToConfirm({ action: 'remove', member });
    };

    const handleConfirm = async () => {
        if (!itemToConfirm) return;
        setIsConfirming(true);
        setError('');
        try {
            if (itemToConfirm.action === 'role' && itemToConfirm.newRole) {
                await updateMemberRole(itemToConfirm.member.id, itemToConfirm.newRole);
            } else if (itemToConfirm.action === 'remove') {
                await removeMember(itemToConfirm.member.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsConfirming(false);
            setItemToConfirm(null);
        }
    };


    if (currentWorkspace.type !== 'organization') {
        return (
            <div className="text-center text-gray-500">
                This feature is only available for organizations.
            </div>
        );
    }
    
    const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Members</h1>
            <p className="text-gray-500 dark:text-gray-400">Invite new members to your organization, <span className="font-semibold text-gray-700 dark:text-gray-200">{currentWorkspace.name}</span>.</p>

            <div className={cardClasses}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invite New Member</h2>
                <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-grow">
                            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="member@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 transition-colors h-[42px] w-28 disabled:opacity-50">
                           {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <><Plus size={16} className="mr-2" /> Invite</> }
                        </button>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </form>
            </div>
            
            <div className={cardClasses}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Members ({members.length})</h2>
                <ul className="space-y-3">
                    {members.map(member => {
                        const isOwner = member.id === currentWorkspace.owner_id;
                        return (
                            <li key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                        <User size={16} className="text-gray-600 dark:text-gray-300"/>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{member.email}{member.id === profile?.id && ' (You)'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${isOwner ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'}`}>
                                        {isOwner ? 'Owner' : member.role}
                                    </span>
                                    {!isOwner && <MemberActions member={member} onRoleChange={(newRole) => handleRoleChangeRequest(member, newRole)} onRemove={() => handleRemoveRequest(member)}/>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

             {itemToConfirm && (
                <ConfirmationModal 
                    isOpen={!!itemToConfirm}
                    onClose={() => setItemToConfirm(null)}
                    onConfirm={handleConfirm}
                    title={itemToConfirm.action === 'remove' ? `Remove ${itemToConfirm.member.email}?` : `Change role for ${itemToConfirm.member.email}?`}
                    message={itemToConfirm.action === 'remove' ? 'They will lose all access to this workspace.' : `Are you sure you want to change this member's role to ${itemToConfirm.newRole}?`}
                    confirmText={itemToConfirm.action === 'remove' ? 'Remove' : 'Change Role'}
                    isConfirming={isConfirming}
                />
            )}
        </div>
    );
};

export default AddPeoplePage;