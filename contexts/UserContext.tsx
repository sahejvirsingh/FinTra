



import React, { useMemo, useCallback, createContext, useContext, useState, useEffect, type PropsWithChildren } from 'react';
import { useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, Currency } from '../types';
import { Database } from '../lib/database.types';

interface UserContextType {
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: PropsWithChildren) => {
    const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
    const { signOut: clerkSignOut } = useClerk();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const signOut = useCallback(async () => {
        await clerkSignOut();
        setProfile(null);
    }, [clerkSignOut]);

    const fetchProfile = useCallback(async () => {
        if (!isSignedIn || !clerkUser) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', clerkUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data as UserProfile);
            } else {
                const newUserProfile: Database['public']['Tables']['users']['Insert'] = {
                    id: clerkUser.id,
                    full_name: clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress || 'New User',
                    currency: 'USD',
                    auto_transfer_savings: false,
                };

                const { data: insertedProfile, error: insertError } = await supabase
                    .from('users')
                    .insert([newUserProfile] as any)
                    .select('*')
                    .single();

                if (insertError) throw insertError;
                setProfile(insertedProfile as UserProfile);
            }
        } catch (err) {
            console.error('Error fetching or creating user profile:', err);
        } finally {
            setLoading(false);
        }
    }, [isSignedIn, clerkUser]);

    useEffect(() => {
        if (isClerkLoaded) {
            fetchProfile();
        }
    }, [isClerkLoaded, fetchProfile]);

    const value = useMemo(() => ({
        profile,
        loading,
        signOut,
        fetchProfile,
    }), [profile, loading, signOut, fetchProfile]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined || context === null) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};