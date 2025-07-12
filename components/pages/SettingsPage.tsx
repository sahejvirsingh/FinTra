
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Share2, Save, Users, User, Lock, Trash2, SlidersHorizontal, CheckCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabaseClient';
import { SupportedCurrencies, Currency, UserProfile, Account, Workspace } from '../../types';
import CustomDropdown from '../shared/CustomDropdown';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import ConfirmationModal from '../modals/ConfirmationModal';
import { Database } from '../../lib/database.types';


const SaveButton = ({ onSave, isSaving, disabled }: {
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
}) => {
  return (
    <button onClick={onSave} disabled={isSaving || disabled} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors w-32 h-[38px] flex items-center justify-center disabled:opacity-50">
      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} className="mr-2"/> Save</>}
    </button>
  );
}

const WorkspaceManager = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const { workspaces, deleteWorkspace, currentWorkspace, currentUserRole, fetchWorkspaces } = useWorkspace();
    const { profile } = useUser();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchWorkspaces();
        }
    }, [refreshTrigger, fetchWorkspaces]);

    const personalWorkspacesCount = workspaces.filter(w => w.type === 'personal').length;

    const handleDeleteRequest = (workspace: Workspace) => {
        setDeleteError('');
        if (currentWorkspace.id === workspace.id) {
            setDeleteError("You cannot delete the workspace you are currently in. Switch to another workspace first.");
            return;
        }
        setWorkspaceToDelete(workspace);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!workspaceToDelete) return;
        setIsDeleting(true);
        setDeleteError('');
        try {
            await deleteWorkspace(workspaceToDelete.id);
            setIsConfirmOpen(false);
            setWorkspaceToDelete(null);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'An unknown error occurred.');
            // Don't close the modal on error so the user can see it
        } finally {
            setIsDeleting(false);
        }
    };
    
    const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6";
    if(!profile) return null;

    return (
        <div className={cardClasses}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center"><Users className="mr-3" />Manage Workspaces</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your personal and organization workspaces.</p>
             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {workspaces.map(ws => {
                    const isOwner = ws.owner_id === profile.id;
                    const isLastPersonal = ws.type === 'personal' && personalWorkspacesCount <= 1;
                    const canDelete = isOwner && !isLastPersonal;
                    
                    return (
                        <div key={ws.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                    {ws.type === 'personal' ? <User size={16} className="text-gray-600 dark:text-gray-300"/> : <Users size={16} className="text-gray-600 dark:text-gray-300"/>}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{ws.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{ws.type}</p>
                                </div>
                            </div>
                            <div>
                                {canDelete ? (
                                    <button onClick={() => handleDeleteRequest(ws)} className="flex items-center text-sm font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors">
                                        <Trash2 size={14} className="mr-2"/> Delete
                                    </button>
                                ) : (
                                    isOwner && isLastPersonal ? (
                                        <button disabled className="flex items-center text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed px-3 py-1.5 rounded-lg">
                                            <Lock size={14} className="mr-2"/> Last Personal
                                        </button>
                                    ) : (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1.5 capitalize">{currentUserRole}</span>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {deleteError && <p className="text-sm text-red-500 mt-4 text-center">{deleteError}</p>}
             {isConfirmOpen && workspaceToDelete && (
                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title={`Delete "${workspaceToDelete.name}"?`}
                    message="This will permanently delete the workspace and all associated data, including accounts, expenses, and goals. This action cannot be undone."
                    isConfirming={isDeleting}
                    confirmText="Delete Workspace"
                />
            )}
        </div>
    );
};


const AccountSharingManager = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const { workspaces } = useWorkspace();
    const { profile } = useUser();
    const [allPersonalAccounts, setAllPersonalAccounts] = useState<(Account & { workspace_name: string })[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [sharedWith, setSharedWith] = useState<Set<string>>(new Set());

    // State for auto-saving logic
    const [isToggling, setIsToggling] = useState(false);

    // States for loading and messaging
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    
    const handleAccountSelect = useCallback(async (accountId: string | null) => {
        setSelectedAccount(accountId);
        if (!accountId) {
            setSharedWith(new Set());
            return;
        }
        setIsLoading(true);
        setMessage('');
        try {
            const { data, error } = await supabase
                .from('account_workspaces')
                .select('workspace_id')
                .eq('account_id', accountId);
            
            if (error) throw error;

            const sharedIds = new Set((data as { workspace_id: string }[] | null)?.map(d => d.workspace_id) || []);
            setSharedWith(sharedIds);
        } catch (err) {
            console.error("Error fetching shared status:", err);
            setMessage("Error: Could not fetch sharing status.");
            setSharedWith(new Set());
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchOwnedAccounts = useCallback(async () => {
        if (!profile || workspaces.length === 0) {
            setIsLoading(false);
            return;
        }
        
        const personalWorkspaceIds = workspaces.filter(w => w.type === 'personal').map(w => w.id);
        if (personalWorkspaceIds.length === 0) {
            setAllPersonalAccounts([]);
            setIsLoading(false);
            return;
        }

        const { data, error } = await supabase.from('accounts').select('*').in('workspace_id', personalWorkspaceIds);
        
        if (!error && data) {
             const workspaceNameMap = new Map(workspaces.map(w => [w.id, w.name]));
             const fetchedAccounts = data.map((acc) => ({
                 ...acc,
                 workspace_name: workspaceNameMap.get(acc.workspace_id) || 'Unknown Workspace'
             }));
             setAllPersonalAccounts(fetchedAccounts);
             if (fetchedAccounts.length > 0 && !selectedAccount) {
                 await handleAccountSelect(fetchedAccounts[0].id);
             } else {
                 setIsLoading(false);
             }
        } else {
            setAllPersonalAccounts([]);
            setIsLoading(false);
        }
    }, [profile, workspaces, handleAccountSelect, selectedAccount]);

    useEffect(() => {
        fetchOwnedAccounts();
    }, [fetchOwnedAccounts, refreshTrigger]);


    const handleWorkspaceToggle = async (workspaceId: string) => {
        if (!selectedAccount || isToggling) return;

        const originalSharedWith = new Set(sharedWith);
        const optimisticSharedWith = new Set(sharedWith);
        const isCurrentlyShared = optimisticSharedWith.has(workspaceId);

        if (isCurrentlyShared) {
            optimisticSharedWith.delete(workspaceId);
        } else {
            optimisticSharedWith.add(workspaceId);
        }

        // Optimistic UI update and disable controls
        setSharedWith(optimisticSharedWith);
        setIsToggling(true);
        setMessage('');

        try {
            const { error: rpcError } = await supabase.rpc('share_account_with_workspaces', {
                p_account_id: selectedAccount,
                p_workspace_ids: Array.from(optimisticSharedWith)
            });

            if (rpcError) throw rpcError;
            
            setMessage('Settings updated!');
        } catch (err) {
            // On error, revert the UI state
            setSharedWith(originalSharedWith);
            setMessage('Error: Could not save settings.');
            console.error("Sharing error:", err);
        } finally {
            setIsToggling(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6";
    const getAccountLabel = useCallback((id: string | null) => {
        if (!id) return 'Select an account...';
        const account = allPersonalAccounts.find(a => a.id === id);
        return account ? `${account.name} (from ${account.workspace_name})` : 'Loading...';
    }, [allPersonalAccounts]);

    const organizationWorkspaces = workspaces.filter(w => w.type === 'organization');

    return (
        <div className={cardClasses}>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center"><Share2 className="mr-3" />Account Sharing</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Share accounts from your personal workspaces with your organizations. Changes are saved automatically.</p>
             {message && <p className={`mt-2 text-sm text-center font-semibold ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">1. Select an Account to Share</label>
                    <CustomDropdown
                        options={allPersonalAccounts.map(a => a.id)}
                        value={selectedAccount}
                        onChange={handleAccountSelect}
                        placeholder="Select an account..."
                        getLabel={getAccountLabel}
                    />
                </div>
                {selectedAccount && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">2. Share with Organizations</label>
                        {isLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div> :
                        <div className="space-y-2">
                            {organizationWorkspaces.length > 0 ? (
                                organizationWorkspaces.map(ws => (
                                    <div key={ws.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{ws.name}</span>
                                        <button 
                                            onClick={() => handleWorkspaceToggle(ws.id)} 
                                            disabled={isToggling}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 ${sharedWith.has(ws.id) ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${sharedWith.has(ws.id) ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">You are not a member of any organizations to share with.</p>
                            )}
                        </div>
                        }
                    </div>
                )}
                 {allPersonalAccounts.length === 0 && !isLoading && (
                     <p className="text-sm text-gray-500 text-center py-4">You have no personal accounts to share.</p>
                 )}
            </div>
        </div>
    );
};

const SettingsPage = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, fetchProfile } = useUser();
  
  // Profile settings state
  const [fullName, setFullName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const hasProfileChanges = profile ? fullName !== profile.full_name : false;
  
  // Financial settings state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [secondaryCurrency, setSecondaryCurrency] = useState<Currency | ''>('');
  const [autoTransfer, setAutoTransfer] = useState<boolean>(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState('');
  const [originalPrefs, setOriginalPrefs] = useState({});
  const hasPrefsChanges = profile ? JSON.stringify({c1:selectedCurrency, c2:secondaryCurrency, at:autoTransfer}) !== JSON.stringify(originalPrefs) : false;

  
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      
      const currentPrefs = {
          c1: profile.currency,
          c2: profile.secondary_currency || '',
          at: profile.auto_transfer_savings
      };
      setSelectedCurrency(currentPrefs.c1 as Currency);
      setSecondaryCurrency(currentPrefs.c2 as (Currency | ''));
      setAutoTransfer(currentPrefs.at);
      setOriginalPrefs(currentPrefs);
    }
  }, [profile]);

  
  const handleSaveProfile = async () => {
    if (!profile || !hasProfileChanges) return;
    setIsSavingProfile(true); setProfileMessage('');
    const updatePayload: Database['public']['Tables']['users']['Update'] = { full_name: fullName };
    const { error } = await supabase.from('users').update(updatePayload).eq('id', profile.id);
    setIsSavingProfile(false);
    if (error) { setProfileMessage('Error saving profile.'); } 
    else {
        setProfileMessage('Profile saved!');
        await fetchProfile();
        setTimeout(() => setProfileMessage(''), 2000);
    }
  };
  
  const handleSavePrefs = async () => {
    if (!profile || !hasPrefsChanges) return;
    setIsSavingPrefs(true); setPrefsMessage('');
    const prefsUpdate: Database['public']['Tables']['users']['Update'] = {
        currency: selectedCurrency,
        secondary_currency: secondaryCurrency || null,
        auto_transfer_savings: autoTransfer,
    };
    const { error } = await supabase.from('users').update(prefsUpdate).eq('id', profile.id);
    setIsSavingPrefs(false);
    if(error) { setPrefsMessage('Error saving preferences.'); }
    else {
        setPrefsMessage('Preferences saved!');
        await fetchProfile();
        setTimeout(() => setPrefsMessage(''), 2000);
    }
  };

  const currencyOptions = Object.keys(SupportedCurrencies) as Currency[];
  const getCurrencyLabel = (code: Currency | '') => code ? `${code} - ${SupportedCurrencies[code as Currency].name}` : 'None';
  
  const primaryCurrencyOptions = currencyOptions.filter(c => c !== secondaryCurrency);
  const secondaryCurrencyOptions: (Currency | '')[] = ['', ...currencyOptions.filter(c => c !== selectedCurrency)];

  const cardClasses = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6";
  const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-300";
  const descriptionClasses = "mt-1 text-sm text-gray-500 dark:text-gray-400";
  const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";

  if (!profile) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      <div className={cardClasses}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
          {hasProfileChanges && <SaveButton onSave={handleSaveProfile} isSaving={isSavingProfile} disabled={!hasProfileChanges} />}
        </div>
        {profileMessage && <p className={`text-sm mt-2 ${profileMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{profileMessage}</p>}
         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div><label htmlFor="fullName" className={labelClasses}>Full Name</label><p className={descriptionClasses}>This name will be displayed across the application.</p></div>
                <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses}/>
            </div>
         </div>
      </div>
      
      <WorkspaceManager refreshTrigger={refreshTrigger} />
      <AccountSharingManager refreshTrigger={refreshTrigger} />

      <div className={cardClasses}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className={labelClasses}>Theme</p>
              <p className={descriptionClasses}>Switch between light and dark mode.</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
               <button onClick={() => theme !== 'light' && toggleTheme()} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${theme === 'light' ? 'bg-white dark:bg-gray-800 shadow' : 'text-gray-500 dark:text-gray-300'}`}>Light</button>
               <button onClick={() => theme !== 'dark' && toggleTheme()} className={`px-4 py-1.5 text-sm rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white shadow' : 'text-gray-500'}`}>Dark</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className={cardClasses}>
         <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Financial Preferences</h2>
            {hasPrefsChanges && <SaveButton onSave={handleSavePrefs} isSaving={isSavingPrefs} disabled={!hasPrefsChanges} />}
         </div>
         {prefsMessage && <p className={`text-sm mt-2 ${prefsMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{prefsMessage}</p>}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div><label className={labelClasses}>Default Currency</label><p className={descriptionClasses}>Used for all primary displays.</p></div>
            <CustomDropdown<Currency> isSearchable options={primaryCurrencyOptions} value={selectedCurrency} onChange={setSelectedCurrency} placeholder="Select primary currency" getLabel={getCurrencyLabel}/>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div><label className={labelClasses}>Secondary Currency</label><p className={descriptionClasses}>For viewing exchange rates on the Accounts page.</p></div>
            <CustomDropdown<Currency | ''> isSearchable options={secondaryCurrencyOptions} value={secondaryCurrency} onChange={setSecondaryCurrency} placeholder="Select secondary currency" getLabel={getCurrencyLabel}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div><label className={labelClasses}>Auto-transfer to Savings</label><p className={descriptionClasses}>Move leftover budget to Savings at month-end.</p></div>
            <div className="flex justify-end"><button onClick={() => setAutoTransfer(!autoTransfer)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoTransfer ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoTransfer ? 'translate-x-6' : 'translate-x-1'}`}/></button></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
