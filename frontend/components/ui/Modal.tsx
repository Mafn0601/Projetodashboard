'use client';

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  className,
  showFooter = true
}: ModalProps) {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4 md:py-8"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 md:p-8 shadow-2xl my-auto",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 md:right-4 md:top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        {title ? (
          <div className="mb-4 md:mb-6 pr-12">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            {description ? (
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 md:mt-6 space-y-4 md:space-y-6 overflow-visible">{children}</div>

        {showFooter ? (
          <div className="mt-6 md:mt-8 flex justify-end gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

