'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  dropdownOffset?: number; // Offset adicional do dropdown (em pixels)
  forceAbove?: boolean; // Forçar dropdown sempre para cima
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, label, options, value, onChange, error, placeholder, helperText, id, required, disabled, dropdownOffset = 0, forceAbove = false }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value || '');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [dropdownPosition, setDropdownPosition] = React.useState<'below' | 'above'>('below');
    const selectId = id ?? React.useId();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Atualizar valor selecionado quando value prop mudar
    React.useEffect(() => {
      setSelectedValue(value || '');
    }, [value]);

    // Fechar dropdown ao clicar fora
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Calcular se dropdown deve abrir acima ou abaixo
    React.useEffect(() => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        if (!forceAbove && spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setDropdownPosition('above');
        } else if (forceAbove) {
          setDropdownPosition('above');
        } else {
          setDropdownPosition('below');
        }
      }
    }, [isOpen, forceAbove]);

    React.useEffect(() => {
      if (isOpen) {
        setSearchTerm('');
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === selectedValue);
    const displayText = selectedOption?.label || placeholder || 'Selecione...';
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    return (
      <div className="flex w-full min-w-0 flex-col gap-2" ref={ref}>
        {label ? (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        ) : null}
        <div className="relative w-full min-w-0" ref={containerRef}>
          <button
            id={selectId}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "flex h-11 w-full min-w-0 items-center justify-between rounded-lg border-2 bg-white dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-all duration-200",
              "hover:border-slate-400 dark:hover:border-slate-500",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-md",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900",
              !selectedValue && "text-slate-400 dark:text-slate-500",
              error 
                ? "border-red-500 hover:border-red-600 focus:border-red-500 focus:ring-red-500/20" 
                : "border-slate-300 dark:border-slate-600",
              className
            )}
          >
            <span className="truncate">{displayText}</span>
            <svg 
              className={cn(
                "h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div 
              className={cn(
                "absolute left-0 right-0 z-50 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg animate-in fade-in-0 zoom-in-95 max-h-[min(15rem,calc(100vh-8rem))] overflow-auto",
                dropdownPosition === 'below' ? 'top-full mt-2' : 'bottom-full mb-2'
              )}
            >
              <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite para filtrar..."
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-700 dark:text-slate-400">
                  Nenhuma opção encontrada
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm transition-colors break-words",
                      "hover:bg-slate-100 dark:hover:bg-slate-700",
                      "focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none",
                      selectedValue === option.value
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-slate-900 dark:text-slate-100"
                    )}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
