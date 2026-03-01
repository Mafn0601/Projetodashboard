'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, required, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-lg border-2 bg-white dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none ring-offset-white dark:ring-offset-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200",
            "hover:border-slate-400 dark:hover:border-slate-500",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-md",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900",
            error 
              ? "border-red-500 hover:border-red-600 focus:border-red-500 focus:ring-red-500/20" 
              : "border-slate-300 dark:border-slate-600",
            className
          )}
          required={required}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-600 dark:text-slate-300">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

