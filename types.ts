

import {
  Landmark, Briefcase, TrendingUp, CreditCard, ShieldCheck, type LucideIcon,
  Wallet, PiggyBank, CircleDollarSign, Car, Home, GraduationCap, Gift, Plane, Users, ClipboardList
} from 'lucide-react';
import { AllCurrencies } from './utils/currencies';

export type Page = 'dashboard' | 'settings' | 'analytics' | 'transactions' | 'financial_goals' | 'accounts' | 'help' | 'emi' | 'add_people' | 'budgeting';

export const iconMap: { [key: string]: LucideIcon } = {
  Landmark,
  Briefcase,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Wallet,
  PiggyBank,
  CircleDollarSign,
  Car,
  Home,
  GraduationCap,
  Gift,
  Plane,
  Users,
  ClipboardList,
  'default': Briefcase,
};

export type Workspace = {
    id: string;
    name: string;
    type: 'personal' | 'organization';
    owner_id: string;
    role: 'admin' | 'member';
    is_initial: boolean;
}

export type OrganizationMember = {
    id: string;
    email: string;
    role: 'admin' | 'member';
}


export const AccountTypes = [
  "Checking",
  "Savings",
  "Credit Card",
  "Investment",
  "Loan",
  "Other"
];

export const accountTypeToIconName: { [key: string]: string } = {
  "Checking": 'Wallet',
  "Savings": 'PiggyBank',
  "Credit Card": 'CreditCard',
  "Investment": 'TrendingUp',
  "Loan": 'CircleDollarSign',
  "Car Loan": 'Car',
  "Home Loan": 'Home',
  "Student Loan": 'GraduationCap',
  "Other": 'Briefcase',
};

export const SupportedCurrencies = AllCurrencies;

export type Currency = keyof typeof SupportedCurrencies;

export interface UserProfile {
  id: string;
  updated_at: string;
  full_name: string | null;
  currency: Currency;
  secondary_currency: Currency | null;
  default_expense_account_id: string | null;
  auto_transfer_savings: boolean;
}

export interface CategoryBudget {
    id: string;
    created_at: string;
    user_id: string;
    workspace_id: string;
    year: number;
    month: number;
    category: string;
    amount: number;
}


export interface Account {
  id: string;
  created_at: string;
  name: string;
  type: string;
  balance: number;
  icon_name: string;
  user_id: string;
  workspace_id: string;
}

export enum GoalStatus {
  Pending = 'Pending',
  InProgress = 'In-progress',
  Completed = 'Completed'
}

export interface GoalPayment {
  id: string;
  created_at: string;
  user_id: string;
  goal_id: string;
  account_id: string;
  amount: number;
  payment_type: 'One-Time' | 'SIP';
  payment_date: string;
}

export interface Goal {
  id: string;
  created_at: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: GoalStatus;
  icon_name: string;
  user_id: string;
  workspace_id: string;
  goal_payments?: GoalPayment[];
}

export interface ExpenseItem {
  id: string;
  created_at?: string;
  expense_id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Expense {
  id:string;
  created_at: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  time: string;
  description?: string;
  expense_items?: ExpenseItem[];
  user_id: string;
  account_id: string | null;
  workspace_id: string;
  verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface TopUp {
  id: string;
  created_at: string;
  user_id: string;
  account_id: string;
  amount: number;
  name: string;
  description?: string;
  topup_time: string;
  workspace_id: string;
}

export interface RecurringIncome {
  id: string;
  created_at: string;
  user_id: string;
  account_id: string;
  name: string;
  amount: number;
  day_of_month: number;
  is_active: boolean;
  workspace_id: string;
}

export interface EmiPayment {
  id: string;
  created_at: string;
  user_id: string;
  emi_id: string;
  account_id: string;
  amount: number;
  payment_date: string;
  payment_type: 'One-Time' | 'SIP';
}

export interface EMI {
    id: string;
    created_at: string;
    user_id: string;
    name: string;
    total_amount: number;
    monthly_payment: number;
    due_date_of_month: number;
    start_date: string;
    end_date: string;
    workspace_id: string;
    emi_payments?: EmiPayment[];
}


export const ExpenseCategories = [
  "Groceries",
  "Utilities",
  "Transport",
  "Entertainment",
  "Healthcare",
  "Dining",
  "Shopping",
  "EMI",
  "Financial Goals",
  "Other"
];
