"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";
import { Workspace, OrganizationMember } from "@/types";
interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  currentUserRole: "admin" | "member";
  members: OrganizationMember[];
  loading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (
    name: string,
    type: "personal" | "organization"
  ) => Promise<void>;
  addMember: (email: string) => Promise<void>;
  updateMemberRole: (userId: string, role: "admin" | "member") => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  fetchWorkspaces: () => Promise<void>;
  fetchMembers: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const profile = user?.profile;
  const userLoading = user?.loading;
  const { getToken } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticateSupabase = useCallback(async () => {
    const token = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(token || "");
    return supabase;
  }, [getToken]);

  const fetchWorkspaces = useCallback(async () => {
    const token = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(token || "");
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      await authenticateSupabase();

      const { data, error: rpcError } = await supabase.rpc(
        "get_workspaces_for_user"
      );

      if (rpcError) {
        setError(`Database call failed: ${rpcError.message}`);
        setWorkspaces([]);
      } else {
        const workspaceData = (data as unknown as Workspace[]) || [];
        setWorkspaces(workspaceData);

        // Set current workspace
        const storedId =
          typeof window !== "undefined"
            ? localStorage.getItem("current_workspace_id")
            : null;
        let newCurrentId = null;

        if (storedId && workspaceData.some((ws) => ws.id === storedId)) {
          newCurrentId = storedId;
        } else if (workspaceData.length > 0) {
          const initialPersonalWs = workspaceData.find(
            (ws) => ws.type === "personal" && ws.is_initial
          );
          newCurrentId = initialPersonalWs
            ? initialPersonalWs.id
            : workspaceData[0].id;
        }

        setCurrentWorkspaceId(newCurrentId);
        if (newCurrentId) {
          if (typeof window !== "undefined") {
            localStorage.setItem("current_workspace_id", newCurrentId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [profile, authenticateSupabase, getToken]);

  const currentWorkspace = React.useMemo(() => {
    return (
      workspaces.find((w) => w.id === currentWorkspaceId) || {
        id: "",
        name: "Loading...",
        type: "personal" as const,
        owner_id: "",
        role: "member" as const,
        is_initial: true,
      }
    );
  }, [workspaces, currentWorkspaceId]);

  const currentUserRole = currentWorkspace.role;

  const fetchMembers = useCallback(async () => {
    if (currentWorkspace.type !== "organization" || !currentWorkspace.id) {
      setMembers([]);
      return;
    }

    await authenticateSupabase();
    const token = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(token || "");

    const { data, error } = await supabase
      .from("workspace_members")
      .select("user_id, role, users(full_name, id)")
      .eq("workspace_id", currentWorkspace.id);

    if (error) {
      console.error("Failed to fetch members:", error);
      setMembers([]);
    } else {
      const fetchedMembers = (
        data as Array<{
          user_id: string;
          role: "admin" | "member";
          users: {
            full_name: string;
            id: string;
          } | null;
        }>
      ).map((m) => ({
        id: m.user_id,
        email: m.users?.full_name || "Unknown User",
        role: m.role,
      }));
      setMembers(fetchedMembers);
    }
  }, [currentWorkspace, authenticateSupabase, getToken]);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      if (workspaces.some((w) => w.id === workspaceId)) {
        setCurrentWorkspaceId(workspaceId);
        if (typeof window !== "undefined") {
          localStorage.setItem("current_workspace_id", workspaceId);
        }
      }
    },
    [workspaces]
  );

  const createWorkspace = useCallback(
    async (name: string, type: "personal" | "organization") => {
      await authenticateSupabase();
      const token = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(token || "");
      const { data: newWorkspaceId, error } = await supabase.rpc(
        "create_workspace",
        {
          p_name: name,
          p_type: type,
        }
      );

      if (error) throw error;

      await fetchWorkspaces();
      if (newWorkspaceId) {
        switchWorkspace(newWorkspaceId as string);
      }
    },
    [authenticateSupabase, fetchWorkspaces, switchWorkspace, getToken]
  );

  const addMember = useCallback(
    async (email: string) => {
      if (currentWorkspace.type !== "organization") return;

      await authenticateSupabase();
      const token = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(token || "");
      const { error } = await supabase.rpc("add_workspace_member", {
        p_workspace_id: currentWorkspace.id,
        p_user_email: email,
        p_role: "member",
      });

      if (error) throw error;
      await fetchMembers();
    },
    [currentWorkspace, authenticateSupabase, fetchMembers, getToken]
  );

  const updateMemberRole = useCallback(
    async (userId: string, role: "admin" | "member") => {
      if (currentWorkspace.type !== "organization") return;

      await authenticateSupabase();
      const token = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(token || "");
      const { error } = await supabase.rpc("update_workspace_member_role", {
        p_workspace_id: currentWorkspace.id,
        p_user_id: userId,
        p_new_role: role,
      });

      if (error) throw error;
      await fetchMembers();
    },
    [currentWorkspace, authenticateSupabase, fetchMembers, getToken]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (currentWorkspace.type !== "organization") return;

      await authenticateSupabase();
      const token = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(token || "");
      const { error } = await supabase.rpc("delete_workspace_member", {
        p_workspace_id: currentWorkspace.id,
        p_user_id: userId,
      });

      if (error) throw error;
      await fetchMembers();
    },
    [currentWorkspace, authenticateSupabase, fetchMembers, getToken]
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: string) => {
      await authenticateSupabase();
      const token = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(token || "");
      const { error } = await supabase.rpc("delete_workspace", {
        p_workspace_id: workspaceId,
      });

      if (error) throw error;
      await fetchWorkspaces();
    },
    [authenticateSupabase, fetchWorkspaces, getToken]
  );

  useEffect(() => {
    if (!userLoading && profile) {
      fetchWorkspaces();
    } else if (!userLoading && !profile) {
      setLoading(false);
      setWorkspaces([]);
      setCurrentWorkspaceId(null);
      setMembers([]);
    }
  }, [profile, userLoading, fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace.id) {
      fetchMembers();
    }
  }, [currentWorkspace, fetchMembers]);

  return (
    <WorkspaceContext.Provider
      value={{
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
        fetchWorkspaces,
        fetchMembers,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
