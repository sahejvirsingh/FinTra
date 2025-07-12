import {
  Landmark,
  Briefcase,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  type LucideIcon,
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
} from "lucide-react";
import { AllCurrencies } from "./utils/currencies";
import { Database } from "./lib/database.types";

// Page navigation type
export type Page =
  | "dashboard"
  | "settings"
  | "analytics"
  | "transactions"
  | "financial_goals"
  | "accounts"
  | "help"
  | "emi"
  | "add_people"
  | "budgeting";

// Map icon names to Lucide icon components
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
  default: Briefcase,
};

// Currencies
export const SupportedCurrencies = AllCurrencies;
export type Currency = keyof typeof SupportedCurrencies;

// --- Database-derived & Client-side types ---

// Workspace
export type Workspace =
  Database["public"]["Functions"]["get_workspaces_for_user"]["Returns"][number];
export type OrganizationMember = {
  id: string;
  email: string; // Note: This is used for display name (full_name from users table)
  role: "admin" | "member";
};

// User Profile with stricter currency type
type DbUserProfile = Database["public"]["Tables"]["users"]["Row"];
export interface UserProfile
  extends Omit<DbUserProfile, "currency" | "secondary_currency"> {
  currency: Currency;
  secondary_currency: Currency | null;
}

// Budget
export type PredictedBudget =
  Database["public"]["Functions"]["get_predicted_spending"]["Returns"][number];

// Account
export type Account = Database["public"]["Tables"]["accounts"]["Row"];

// Goals
export type GoalPayment = Database["public"]["Tables"]["goal_payments"]["Row"];
type DbGoal = Database["public"]["Tables"]["goals"]["Row"];
export type Goal = Omit<DbGoal, "status"> & {
  status: GoalStatus;
  goal_payments?: GoalPayment[];
};

// Expenses
export type ExpenseItem = Database["public"]["Tables"]["expense_items"]["Row"];
export type NewExpenseItem = Pick<ExpenseItem, "name" | "price" | "quantity">;
export type Expense = Database["public"]["Tables"]["expenses"]["Row"] & {
  expense_items?: ExpenseItem[];
};

// Top-ups (Income)
export type TopUp = Database["public"]["Tables"]["topups"]["Row"];
export type RecurringIncome =
  Database["public"]["Tables"]["recurring_incomes"]["Row"];

// EMI
export type EmiPayment = Database["public"]["Tables"]["emi_payments"]["Row"];
export type EMI = Database["public"]["Tables"]["emis"]["Row"] & {
  emi_payments?: EmiPayment[];
};

// --- Enums and Constants ---

// Goal Status
export enum GoalStatus {
  Pending = "Pending",
  InProgress = "In-progress",
  Completed = "Completed",
}

// Account Types
export const AccountTypes = [
  "Checking",
  "Savings",
  "Credit Card",
  "Investment",
  "Loan",
  "Other",
];

export const accountTypeToIconName: { [key: string]: string } = {
  Checking: "Wallet",
  Savings: "PiggyBank",
  "Credit Card": "CreditCard",
  Investment: "TrendingUp",
  Loan: "CircleDollarSign",
  "Car Loan": "Car",
  "Home Loan": "Home",
  "Student Loan": "GraduationCap",
  Other: "Briefcase",
};

// Expense Categories
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
  "Other",
];

// An occurrence of a purchased item within an expense
export type ItemOccurrence = ExpenseItem & {
  expenseTitle: string;
  expenseDate: string;
  expenseId: string;
};

// Aggregated data for a specific item across all expenses
export type AggregatedItem = {
  name: string;
  totalQuantity: number;
  totalSpent: number;
  occurrences: ItemOccurrence[];
};
