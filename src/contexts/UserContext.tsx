"use client";
import {
  useMemo,
  useCallback,
  createContext,
  useContext,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
// import { supabase } from "../lib/supabaseClient";
// import { useSession, useUser } from '@clerk/nextjs'
// import { createClient } from "@supabase/supabase-js";
import { UserProfile } from "../types";
import { Database } from "../lib/database.types";
import {
  useAuth,
  useUser as useClerkUser,
  useClerk,
  useSession,
} from "@clerk/clerk-react";
import { supabaseClient } from "../lib/supabaseClient";
// import { getAuthenticatedSupabaseClient } from "../lib/getAuthenticatedSupabaseClient";
// import { get } from "http";
// import { type useUser as ClerkUser } from '@clerk/clerk-react';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clerkToken: string | null;
}

const UserContext = createContext<UserContextType | null>(null);

const USER_PROFILE_STORAGE_KEY = "fintra_user_profile";

export const UserProvider = ({ children }: PropsWithChildren) => {
  const { getToken } = useAuth();
  const {
    user: clerkUser,
    isLoaded: clerkIsLoaded,
    isSignedIn,
  } = useClerkUser();
  const { session } = useSession();
  const { signOut: clerkSignOut } = useClerk();

  // Create a `client` object for accessing Supabase data using the Clerk token

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedProfile = sessionStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch (e) {
        console.error("Failed to parse user profile from sessionStorage", e);
        sessionStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      }
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [clerkToken, setClerkToken] = useState<string | null>(null);

  const updateProfile = useCallback((newProfile: UserProfile | null) => {
    setProfile(newProfile);
    if (typeof window !== "undefined") {
      if (newProfile) {
        sessionStorage.setItem(
          USER_PROFILE_STORAGE_KEY,
          JSON.stringify(newProfile)
        );
      } else {
        sessionStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await clerkSignOut();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    }
    setProfile(null);
  }, [clerkSignOut]);

  const getOrCreateProfile = useCallback(
    async (user: {
      id: string;
      fullName?: string;
      emailAddresses: Array<{ emailAddress: string }>;
    }): Promise<UserProfile | null> => {
      try {
        const token = await getToken({ template: "supabase" });
        // if (token) {
        //   await supabase.setSession({
        //     access_token: token,
        //     refresh_token: token,
        //   })
        // }
        const supabase = await supabaseClient(token || "");
        //
        const supabaseToken = await session?.getToken({
          template: "supabase",
        });
        // console.log("Clerk Session:", supabaseToken);
        if (!supabaseToken) throw new Error("No Supabase token from Clerk");

        // Authenticate Supabase with the JWT
        await supabase.auth.setSession({
          access_token: supabaseToken,
          refresh_token: supabaseToken,
        });

        //
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", user?.emailAddresses[0]?.emailAddress)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          return data as unknown as UserProfile;
        } else {
          const supabaseToken = await session?.getToken({
            template: "supabase",
          });
          // console.log("Clerk Session:", supabaseToken);
          if (!supabaseToken) throw new Error("No Supabase token from Clerk");

          // Authenticate Supabase with the JWT
          await supabase.auth.setSession({
            access_token: supabaseToken,
            refresh_token: supabaseToken,
          });
          // New user: create a profile and their initial workspace and account.
          const newUserProfile: Database["public"]["Tables"]["users"]["Insert"] =
            {
              id: user.id,
              full_name:
                user.fullName ||
                user.emailAddresses[0]?.emailAddress ||
                "New User",
              currency: "USD",
            };

          const { data: insertedProfile, error: insertError } = await supabase
            .from("users")
            .insert(newUserProfile)
            .select()
            .single();

          if (insertError) throw insertError;

          // Replicate the previous trigger's logic to create an initial personal workspace.
          const { data: wsId, error: wsError } = await supabase.rpc(
            "create_workspace",
            {
              p_name: `${insertedProfile.full_name}'s Workspace`,
              p_type: "personal",
            }
          );
          if (wsError) throw wsError;

          // Create a default "Cash" account for the new user.
          const { data: newAccount, error: accError } = await supabase
            .from("accounts")
            .insert({
              name: "Cash",
              type: "Checking",
              balance: 0,
              icon_name: "Wallet",
              user_id: insertedProfile.id,
              workspace_id: wsId as string,
            })
            .select()
            .single();
          if (accError) throw accError;

          // Set this new account as the default for expenses.
          const { error: updateUserError } = await supabase
            .from("users")
            .update({ default_expense_account_id: newAccount.id })
            .eq("id", insertedProfile.id);
          if (updateUserError) throw updateUserError;

          return {
            ...insertedProfile,
            default_expense_account_id: newAccount.id,
          } as UserProfile;
        }
      } catch (err) {
        console.error("Error handling user profile setup:", err);
        return null;
      }
    },
    [session, getToken]
  );

  useEffect(() => {
    if (!clerkIsLoaded) return;

    const syncUser = async () => {
      if (isSignedIn && session && clerkUser) {
        setLoading(true);
        try {
          // Get Clerk JWT for Supabase
          // const supabaseToken = await session.getToken({
          //   template: "supabase",
          // });
          // const currentClerkToken = await session.getToken(); // Get the default Clerk token
          // setClerkToken(currentClerkToken);

          // console.log("Clerk Session:", supabaseToken);
          // if (!supabaseToken) throw new Error("No Supabase token from Clerk");

          // // Authenticate Supabase with the JWT
          // await supabase.auth.setSession({
          //   access_token: supabaseToken,
          //   refresh_token: supabaseToken,
          // });

          // Sync or create user profile
          const userProfile = await getOrCreateProfile({
            id: clerkUser.id,
            fullName: clerkUser.fullName || undefined,
            emailAddresses: clerkUser.emailAddresses.map((email) => ({
              emailAddress: email.emailAddress,
            })),
          });
          updateProfile(userProfile);
        } catch (e) {
          console.error("Error syncing user:", e);
          updateProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        // Not signed in — clear everything
        updateProfile(null);
        setClerkToken(null);
        // const token = await session?.getToken({ template: "supabase" });
        // const supabase = await supabaseClient(token || "");
        // await supabase.auth.signOut();
        setLoading(false);
      }
    };

    syncUser();
  }, [
    clerkIsLoaded,
    isSignedIn,
    session,
    clerkUser,
    getOrCreateProfile,
    updateProfile,
  ]);

  // const manualFetchProfile = useCallback(async () => {
  //   if (clerkUser) {
  //     setLoading(true);
  //     const userProfile = await getOrCreateProfile({
  //       id: clerkUser.id,
  //       fullName: clerkUser.fullName || undefined,
  //       emailAddresses: clerkUser.emailAddresses.map((email) => ({
  //         emailAddress: email.emailAddress,
  //       })),
  //     });
  //     updateProfile(userProfile);
  //     setLoading(false);
  //   }
  // }, [clerkUser, getOrCreateProfile, updateProfile]);

  const value = useMemo(
    () => ({
      profile,
      clerkToken,
      loading,
      signOut,
      // fetchProfile: manualFetchProfile,
    }),
    [profile, loading, signOut, clerkToken]
  );

  return (
    <UserContext.Provider
      value={{
        ...value,
        fetchProfile: async () => {}, // Add empty fetchProfile to satisfy type requirement
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  // if (!context) {
  //   throw new Error("useUser must be used within a UserProvider");
  // }
  return context;
};
