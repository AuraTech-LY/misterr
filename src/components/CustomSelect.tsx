import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "اختر من القائمة",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 bg-white border-2 border-gray-200 rounded-full text-right flex items-center justify-between transition-all duration-300 hover:border-[#781220] focus:border-[#781220] focus:outline-none ${
          isOpen ? 'border-[#781220] shadow-lg' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.icon}
          <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeInUp">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full p-3 text-right flex items-center gap-3 transition-all duration-200 hover:bg-[#781220] hover:text-white ${
                value === option.value 
                  ? 'bg-red-50 text-[#781220] font-semibold' 
                  : 'text-gray-700'
              }`}
            >
              {option.icon}
              <span>{option.label}</span>
              {value === option.value && (
                <div className="mr-auto w-2 h-2 bg-[#781220] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};