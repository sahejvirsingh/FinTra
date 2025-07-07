
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      account_workspaces: {
        Row: {
          account_id: string
          created_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_workspaces_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          balance: number
          created_at: string
          icon_name: string
          id: string
          name: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          balance: number
          created_at?: string
          icon_name: string
          id?: string
          name: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          icon_name?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      category_budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          month: number
          user_id: string
          workspace_id: string
          year: number
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          month: number
          user_id: string
          workspace_id: string
          year: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          month?: number
          user_id?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_budgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      emis: {
        Row: {
          created_at: string
          due_date_of_month: number
          end_date: string
          id: string
          monthly_payment: number
          name: string
          start_date: string
          total_amount: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_date_of_month: number
          end_date: string
          id?: string
          monthly_payment: number
          name: string
          start_date: string
          total_amount: number
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_date_of_month?: number
          end_date?: string
          id?: string
          monthly_payment?: number
          name?: string
          start_date?: string
          total_amount?: number
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emis_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      emi_payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          emi_id: string
          id: string
          payment_date: string
          payment_type: "One-Time" | "SIP"
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          emi_id: string
          id?: string
          payment_date: string
          payment_type: "One-Time" | "SIP"
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          emi_id?: string
          id?: string
          payment_date?: string
          payment_type?: "One-Time" | "SIP"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emi_payments_emi_id_fkey"
            columns: ["emi_id"]
            isOneToOne: false
            referencedRelation: "emis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emi_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          time: string | null
          title: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          time?: string | null
          title: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          time?: string | null
          title?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          name: string
          price: number
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          name: string
          price: number
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          description: string
          icon_name: string
          id: string
          status: "Pending" | "In-progress" | "Completed"
          target_amount: number
          target_date: string
          title: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_amount: number
          description: string
          icon_name: string
          id?: string
          status: "Pending" | "In-progress" | "Completed"
          target_amount: number
          target_date: string
          title: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          description?: string
          icon_name?: string
          id?: string
          status?: "Pending" | "In-progress" | "Completed"
          target_amount?: number
          target_date?: string
          title?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_payments: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          goal_id: string
          id: string
          payment_date: string
          payment_type: "One-Time" | "SIP"
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          goal_id: string
          id?: string
          payment_date: string
          payment_type: "One-Time" | "SIP"
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          goal_id?: string
          id?: string
          payment_date?: string
          payment_type?: "One-Time" | "SIP"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_payments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_incomes: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          day_of_month: number
          id: string
          is_active: boolean
          name: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          day_of_month: number
          id?: string
          is_active?: boolean
          name: string
          user_id: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          day_of_month?: number
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_incomes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_incomes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_incomes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      topups: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          description: string | null
          id: string
          name: string
          topup_time: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          topup_time: string
          user_id: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          topup_time?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topups_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auto_transfer_savings: boolean
          currency: string
          default_expense_account_id: string | null
          full_name: string | null
          id: string
          secondary_currency: string | null
          updated_at: string
        }
        Insert: {
          auto_transfer_savings?: boolean
          currency: string
          default_expense_account_id?: string | null
          full_name?: string | null
          id: string
          secondary_currency?: string | null
          updated_at?: string
        }
        Update: {
          auto_transfer_savings?: boolean
          currency?: string
          default_expense_account_id?: string | null
          full_name?: string | null
          id?: string
          secondary_currency?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          is_initial: boolean
          name: string
          owner_id: string
          type: "personal" | "organization"
        }
        Insert: {
          created_at?: string
          id?: string
          is_initial?: boolean
          name: string
          owner_id: string
          type: "personal" | "organization"
        }
        Update: {
          created_at?: string
          id?: string
          is_initial?: boolean
          name?: string
          owner_id?: string
          type?: "personal" | "organization"
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: "admin" | "member"
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: "admin" | "member"
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: "admin" | "member"
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_emi_payment: {
        Args: {
          p_emi_id: string
          p_account_id: string
          p_amount: number
          p_payment_type: "One-Time" | "SIP"
          p_date: string
          p_expense_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      add_expense: {
        Args: {
          p_user_id: string
          p_account_id: string | null
          p_title: string
          p_amount: number
          p_category: string
          p_date: string
          p_time: string | null
          p_description: string | null
          p_items: Json
          p_workspace_id: string
        }
        Returns: undefined
      }
      add_goal_payment: {
        Args: {
          p_goal_id: string
          p_account_id: string
          p_amount: number
          p_payment_type: "One-Time" | "SIP"
          p_date: string
          p_expense_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      add_topup: {
        Args: {
          p_account_id: string
          p_amount: number
          p_description: string | null
          p_name: string
          p_topup_time: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      add_workspace_member: {
        Args: {
          p_workspace_id: string
          p_user_email: string
          p_role: "admin" | "member"
        }
        Returns: Json
      }
      create_workspace: {
        Args: {
          p_name: string
          p_type: string
        }
        Returns: string
      }
      delete_account: {
        Args: {
          p_account_id: string
        }
        Returns: undefined
      }
      delete_emi: {
        Args: {
          p_emi_id: string
        }
        Returns: undefined
      }
      delete_emi_payment: {
        Args: {
          p_payment_id: string
        }
        Returns: undefined
      }
      delete_expense: {
        Args: {
          p_expense_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      delete_goal: {
        Args: {
          p_goal_id: string
        }
        Returns: undefined
      }
      delete_goal_payment: {
        Args: {
          p_payment_id: string
        }
        Returns: undefined
      }
      delete_topup: {
        Args: {
          p_topup_id: string
        }
        Returns: undefined
      }
      delete_workspace: {
        Args: {
          p_workspace_id: string
        }
        Returns: undefined
      }
      delete_workspace_member: {
        Args: {
          p_workspace_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_accounts_for_workspace: {
        Args: {
          p_workspace_id: string
        }
        Returns: {
          balance: number
          created_at: string
          icon_name: string
          id: string
          name: string
          type: string
          user_id: string
          workspace_id: string
        }[]
      }
      get_net_worth_history: {
        Args: {
          p_workspace_id: string
          p_start_date: string
          p_end_date: string
          p_time_interval: "day" | "week" | "month"
        }
        Returns: {
          snapshot_date: string
          net_worth: number
        }[]
      }
      get_workspaces_for_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          type: "personal" | "organization"
          owner_id: string
          role: "admin" | "member"
          is_initial: boolean
        }[]
      }
      share_account_with_workspaces: {
        Args: {
          p_account_id: string
          p_workspace_ids: string[]
        }
        Returns: undefined
      }
      update_emi_payment: {
        Args: {
          p_payment_id: string
          p_new_account_id: string
          p_new_amount: number
          p_new_payment_type: "One-Time" | "SIP"
          p_new_date: string
        }
        Returns: undefined
      }
      update_expense: {
        Args: {
          p_expense_id: string
          p_user_id: string
          p_new_account_id: string | null
          p_new_title: string
          p_new_amount: number
          p_new_category: string
          p_new_date: string
          p_new_time: string | null
          p_new_description: string | null
          p_new_items: Json
        }
        Returns: undefined
      }
      update_goal: {
        Args: {
          p_goal_id: string
          p_title: string
          p_description: string
          p_target_amount: number
          p_current_amount: number
          p_target_date: string
          p_status: "Pending" | "In-progress" | "Completed"
          p_icon_name: string
        }
        Returns: undefined
      }
      update_goal_payment: {
        Args: {
          p_payment_id: string
          p_new_account_id: string
          p_new_amount: number
          p_new_payment_type: "One-Time" | "SIP"
          p_new_date: string
        }
        Returns: undefined
      }
      update_workspace_member_role: {
        Args: {
          p_workspace_id: string
          p_user_id: string
          p_new_role: "admin" | "member"
        }
        Returns: undefined
      }
      upsert_category_budgets: {
        Args: {
          budgets: Json[]
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
