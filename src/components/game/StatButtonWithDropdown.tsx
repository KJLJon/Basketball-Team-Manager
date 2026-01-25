import React, { useState, useRef, useEffect } from 'react';

interface StatButtonWithDropdownProps {
  label: string;
  options: { label: string; value: string }[];
  defaultValue: string;
  onSelect: (value: string) => void;
  className?: string;
}

export function StatButtonWithDropdown({
  label,
  options,
  defaultValue,
  onSelect,
  className = '',
}: StatButtonWithDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMainClick = () => {
    onSelect(defaultValue);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleMainClick}
        className={`flex-1 rounded-l-lg px-3 py-2 font-medium transition-colors active:scale-95 ${className}`}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={handleDropdownClick}
        className={`border-l border-white/20 rounded-r-lg px-2 py-2 transition-colors active:scale-95 ${className}`}
      >
        ⋯
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[100px]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
