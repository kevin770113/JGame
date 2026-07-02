import { useState, useRef, useEffect } from 'react';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // ★ 增加 'yellow' 允許值
  focusColor?: 'purple' | 'blue' | 'gray' | 'yellow'; 
}

export default function CustomSelect({ options, value, onChange, placeholder = '［請選擇］', focusColor = 'purple' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  
  let borderColorClass = 'border-purple-500';
  let highlightColorClass = 'text-purple-400';
  
  if (focusColor === 'blue') {
    borderColorClass = 'border-blue-500';
    highlightColorClass = 'text-blue-400';
  } else if (focusColor === 'gray') {
    borderColorClass = 'border-gray-500';
    highlightColorClass = 'text-gray-300';
  } else if (focusColor === 'yellow') {
    // ★ 增加 yellow 的對應 Tailwind 顏色
    borderColorClass = 'border-yellow-500';
    highlightColorClass = 'text-yellow-400';
  }

  return (
    <div className="relative w-full text-sm sm:text-base" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full bg-gray-900 border ${isOpen ? borderColorClass : 'border-gray-600'} text-gray-200 p-3 rounded text-left flex justify-between items-center outline-none transition-colors shadow-inner`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-gray-200' : 'text-gray-500 truncate pr-4'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="text-gray-500 text-xs transform transition-transform duration-200 shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-600 rounded shadow-2xl max-h-60 overflow-y-auto overscroll-contain">
          {options.map((option) => (
            <li
              key={option.value}
              className={`p-3 border-b border-gray-800 last:border-b-0 transition-colors ${
                option.disabled 
                  ? 'text-gray-600 bg-gray-900/50 cursor-not-allowed' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer'
              } ${value === option.value && !option.disabled ? `bg-gray-800 font-bold ${highlightColorClass}` : ''}`}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              {option.label}
            </li>
          ))}
          {options.length === 0 && (
            <li className="p-3 text-gray-500 text-center">無可用選項</li>
          )}
        </ul>
      )}
    </div>
  );
}
