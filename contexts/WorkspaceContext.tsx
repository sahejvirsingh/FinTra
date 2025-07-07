

import React, { createContext, useState, useEffect, useMemo, useContext, useCallback, type PropsWithChildren } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUser } from './UserContext';
import { OrganizationMember, Workspace } from '../types';

// --- Context Definition ---
interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace;
    currentUserRole: 'admin' | 'member';
    members: OrganizationMember[];
    loading: boolean;
    error: string | null;
    switchWorkspace: (workspaceId: string) => void;
    createWorkspace: (name: string, type: 'personal' | 'organization') => Promise<void>;
    addMember: (email: string) => Promise<void>;
    updateMemberRole: (userId: string, role: 'admin' | 'member') => Promise<void>;
    removeMember: (userId: string) => Promise<void>;
    deleteWorkspace: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const LOCALSTORAGE_KEY_CURRENT_WORKSPACE = 'fintra_current_workspace_id';

// --- Provider Component ---
export const WorkspaceProvider = ({ children }: PropsWithChildren) => {
    const { profile, loading: userLoading } = useUser();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch workspaces the user belongs to
    const fetchWorkspaces = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_workspaces_for_user');
            if (rpcError) {
                console.error("Error fetching workspaces:", rpcError);
                setError(`Database call failed: ${rpcError.message}`);
                setWorkspaces([]);
            } else {
                const workspaceData = (data as unknown as Workspace[]) || [];
                setWorkspaces(workspaceData);
                // Set current workspace ID logic
                const storedId = localStorage.getItem(LOCALSTORAGE_KEY_CURRENT_WORKSPACE);
                if (storedId && workspaceData.some(ws => ws.id === storedId)) {
                    setCurrentWorkspaceId(storedId);
                } else if (workspaceData.length > 0) {
                    // Default to initial personal workspace or the first one
                    const initialPersonalWs = workspaceData.find(ws => ws.type === 'personal' && ws.is_initial);
                    setCurrentWorkspaceId(initialPersonalWs ? initialPersonalWs.id : workspaceData[0].id);
                } else {
                    setCurrentWorkspaceId(null);
                }
            }
        } catch (err) {
            console.error("An exception occurred while fetching workspaces:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred while fetching workspaces.";
            setError(message);
            setWorkspaces([]);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        if (!userLoading && profile) {
            fetchWorkspaces();
        } else if (!userLoading && !profile) {
            // No user, so not loading and no data.
            setLoading(false);
            setWorkspaces([]);
            setCurrentWorkspaceId(null);
        }
    }, [profile, userLoading, fetchWorkspaces]);


    // Derived state for the current workspace and user role
    const currentWorkspace = useMemo(() => {
        return workspaces.find(w => w.id === currentWorkspaceId) || { id: '', name: 'Loading...', type: 'personal' as const, owner_id: '', role: 'member' as const, is_initial: true};
    }, [workspaces, currentWorkspaceId]);

    const currentUserRole = useMemo(() => {
        return currentWorkspace.role;
    }, [currentWorkspace]);

    const fetchMembers = useCallback(async () => {
        if (currentWorkspace.type !== 'organization' || !currentWorkspace.id) {
            setMembers([]);
            return;
        }

        type MemberWithUser = {
            user_id: string;
            role: 'admin' | 'member';
            users: {
                full_name: string | null;
                id: string;
            } | null;
        };

        const { data, error } = await supabase
            .from('workspace_members')
            .select('user_id, role, users(full_name, id)')
            .eq('workspace_id', currentWorkspace.id);

        if (error) {
            console.error("Failed to fetch members:", error);
            setMembers([]);
        } else {
            const typedData = data as any as MemberWithUser[];
            const fetchedMembers = typedData.map((m) => ({
                id: m.user_id,
                email: m.users?.full_name || 'Unknown User', // Note: 'email' property is used for display name
                role: m.role
            }));
            setMembers(fetchedMembers);
        }
    }, [currentWorkspace]);

    // Fetch members when workspace changes to an organization
    useEffect(() => {
        if (currentWorkspace.id) {
            fetchMembers();
        }
    }, [currentWorkspace, fetchMembers]);

    // --- Actions ---
    const switchWorkspace = useCallback((workspaceId: string) => {
        if (workspaces.some(w => w.id === workspaceId)) {
            setCurrentWorkspaceId(workspaceId);
            localStorage.setItem(LOCALSTORAGE_KEY_CURRENT_WORKSPACE, workspaceId);
        }
    }, [workspaces]);

    const createWorkspace = useCallback(async (name: string, type: 'personal' | 'organization') => {
        const { data: newWorkspaceId, error } = await supabase.rpc('create_workspace', { p_name: name, p_type: type });
        if (error) {
            console.error("Failed to create workspace", error);
            throw error;
        }
        await fetchWorkspaces();
        if (newWorkspaceId) {
            switchWorkspace(newWorkspaceId as string);
        }
    }, [fetchWorkspaces, switchWorkspace]);
    
    const addMember = useCallback(async (email: string) => {
        if (currentWorkspace.type !== 'organization') return;
        const { error } = await supabase.rpc('add_workspace_member', { p_workspace_id: currentWorkspace.id, p_user_email: email, p_role: 'member' });
        if (error) {
             console.error("Failed to add member", error);
             throw error;
        }
        await fetchMembers();
    }, [currentWorkspace, fetchMembers]);

    const updateMemberRole = useCallback(async (userId: string, role: 'admin' | 'member') => {
        if (currentWorkspace.type !== 'organization') return;
        const { error } = await supabase.rpc('update_workspace_member_role', { 
            p_workspace_id: currentWorkspace.id, 
            p_user_id: userId, 
            p_new_role: role 
        });
        if (error) throw error;
        await fetchMembers();
    }, [currentWorkspace, fetchMembers]);

    const removeMember = useCallback(async (userId: string) => {
        if (currentWorkspace.type !== 'organization') return;
        const { error } = await supabase.rpc('delete_workspace_member', {
            p_workspace_id: currentWorkspace.id,
            p_user_id: userId
        });
        if (error) throw error;
        await fetchMembers();
    }, [currentWorkspace, fetchMembers]);


    const deleteWorkspace = useCallback(async (workspaceId: string) => {
        const { error } = await supabase.rpc('delete_workspace', { p_workspace_id: workspaceId });
        if (error) {
            console.error("Failed to delete workspace", error);
            throw error;
        }
        await fetchWorkspaces();
    }, [fetchWorkspaces]);
    

    const value = useMemo(() => ({
        workspaces,
        currentWorkspace,
        currentUserRole,
        members,
        loading,
        error,
        switchWorkspace,
        createWorkspace,
        addMember,
        updateMemberRole,
        removeMember,
        deleteWorkspace,
    }), [workspaces, currentWorkspace, currentUserRole, members, loading, error, switchWorkspace, createWorkspace, addMember, updateMemberRole, removeMember, deleteWorkspace]);

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

// --- Custom Hook ---
export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};