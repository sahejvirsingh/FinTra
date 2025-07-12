import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  Account,
  AccountTypes,
  SupportedCurrencies,
  iconMap,
  accountTypeToIconName,
} from "../../types";
import CustomDropdown from "../shared/CustomDropdown";
import { useUser } from "../../contexts/UserContext";

type NewAccountData = Omit<
  Account,
  "id" | "created_at" | "user_id" | "workspace_id"
>;

interface AddAccountModalProps {
  onClose: () => void;
  onAddAccount: (account: NewAccountData) => Promise<void>;
}

const AddAccountModal = ({ onClose, onAddAccount }: AddAccountModalProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [balance, setBalance] = useState("");
  const [iconName, setIconName] = useState("Briefcase");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useUser();
  const profile = user?.profile;
  const currencySymbol =
    profile?.currency && SupportedCurrencies[profile.currency].symbol;

  console.log("profile", profile?.currency);
  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType !== "Other") {
      setCustomType("");
      const suggestedIcon = accountTypeToIconName[newType];
      if (suggestedIcon) setIconName(suggestedIcon);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = type === "Other" ? customType : type;
    if (!name || !finalType || balance === "") {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onAddAccount({
        name,
        type: finalType,
        balance: parseFloat(balance),
        icon_name: iconName,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to add account: ${err.message}`
          : "An unknown error occurred."
      );
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const labelClasses =
    "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add New Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
          id="add-account-form"
        >
          <div>
            <label htmlFor="name" className={labelClasses}>
              Account Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              placeholder="e.g., Chase Checking"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className={labelClasses}>
              Account Type *
            </label>
            <CustomDropdown
              options={AccountTypes}
              value={type}
              onChange={handleTypeChange}
              placeholder="Select account type"
            />
          </div>

          {type === "Other" && (
            <div>
              <label htmlFor="customType" className={labelClasses}>
                Custom Account Type *
              </label>
              <input
                type="text"
                id="customType"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className={inputClasses}
                placeholder="e.g., Vacation Fund"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="balance" className={labelClasses}>
              Initial Balance *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 dark:text-gray-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                id="balance"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className={`${inputClasses} pl-8`}
                placeholder="0.00"
                required
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Icon</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(iconMap)
                .filter((key) => key !== "default")
                .map((key) => {
                  const Icon = iconMap[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setIconName(key)}
                      className={`p-3 rounded-lg border-2 ${
                        iconName === key
                          ? "border-indigo-500 bg-indigo-100 dark:bg-indigo-900/50"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </button>
                  );
                })}
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </form>

        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-account-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors ml-4 w-36 h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Add Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAccountModal;
