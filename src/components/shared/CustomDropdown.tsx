import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface CustomDropdownProps<T extends string> {
  options: readonly T[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  placeholder: string;
  getLabel?: (value: T) => string;
  isSearchable?: boolean;
}

const CustomDropdown = <T extends string>({ options, value, onChange, placeholder, getLabel, isSearchable = false }: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: T) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const filteredOptions = isSearchable
    ? options.filter(option =>
        (getLabel ? getLabel(option) : option).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const displayValue = value && getLabel ? getLabel(value) : value || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 flex items-center justify-between text-left focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {displayValue}
        </span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-20 animate-in fade-in-0 zoom-in-95">
          {isSearchable && (
            <div className="relative p-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md focus:outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer ${
                  value === option
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-800 dark:text-gray-200 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                {getLabel ? getLabel(option) : option}
              </li>
            ))
            ) : (
                <li className="px-3 py-2 text-sm text-gray-500 text-center">No options found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;