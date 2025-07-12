import React from "react";
import {
  BarChart2,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  ReceiptText,
  Settings,
  LogOut,
  Target,
  CalendarClock,
  Users,
  ClipboardList,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { Page } from "@/types";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  page: Page;
  active: boolean;
  onNavigate: (page: Page) => void;
}

const NavItem = ({ icon, label, page, active, onNavigate }: NavItemProps) => (
  <button
    onClick={() => onNavigate(page)}
    className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform ${
      active
        ? "bg-gray-700 text-white"
        : "text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105"
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar = ({ currentPage, onNavigate }: SidebarProps) => {
  const { signOut } = useUser();
  const { currentWorkspace, currentUserRole } = useWorkspace();

  const isOrgAdmin =
    currentWorkspace.type === "organization" && currentUserRole === "admin";
  const showFinancialFeatures = currentWorkspace.type === "personal";

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex-col hidden lg:flex">
      <div className="h-20 border-b border-gray-800 px-4">
        <WorkspaceSwitcher />
      </div>
      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-4">
          <div>
            <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Overview
            </h3>
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              page="dashboard"
              active={currentPage === "dashboard"}
              onNavigate={onNavigate}
            />
            <NavItem
              icon={<BarChart2 size={20} />}
              label="Analytics"
              page="analytics"
              active={currentPage === "analytics"}
              onNavigate={onNavigate}
            />
            <NavItem
              icon={<ReceiptText size={20} />}
              label="Transactions"
              page="transactions"
              active={currentPage === "transactions"}
              onNavigate={onNavigate}
            />
            {showFinancialFeatures && (
              <NavItem
                icon={<Target size={20} />}
                label="Financial Goals"
                page="financial_goals"
                active={currentPage === "financial_goals"}
                onNavigate={onNavigate}
              />
            )}
          </div>
          <div>
            <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Finance
            </h3>
            <NavItem
              icon={<CreditCard size={20} />}
              label="Accounts"
              page="accounts"
              active={currentPage === "accounts"}
              onNavigate={onNavigate}
            />
            {showFinancialFeatures && (
              <NavItem
                icon={<ClipboardList size={20} />}
                label="Budgeting"
                page="budgeting"
                active={currentPage === "budgeting"}
                onNavigate={onNavigate}
              />
            )}
            {showFinancialFeatures && (
              <NavItem
                icon={<CalendarClock size={20} />}
                label="EMIs"
                page="emi"
                active={currentPage === "emi"}
                onNavigate={onNavigate}
              />
            )}
          </div>
          {isOrgAdmin && (
            <div>
              <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Organization
              </h3>
              <NavItem
                icon={<Users size={20} />}
                label="Add People"
                page="add_people"
                active={currentPage === "add_people"}
                onNavigate={onNavigate}
              />
            </div>
          )}
        </nav>
        <div className="px-4 py-6 space-y-2 border-t border-gray-800">
          <NavItem
            icon={<Settings size={20} />}
            label="Settings"
            page="settings"
            active={currentPage === "settings"}
            onNavigate={onNavigate}
          />
          <NavItem
            icon={<HelpCircle size={20} />}
            label="Help"
            page="help"
            active={currentPage === "help"}
            onNavigate={onNavigate}
          />
          <button
            onClick={signOut}
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105 transition-all duration-200 ease-in-out transform"
          >
            <LogOut size={20} />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
