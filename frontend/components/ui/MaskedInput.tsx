'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export type MaskType = 'phone' | 'plate' | 'cpfCnpj' | 'placaChassi' | 'currency' | 'anoFabMod' | 'none';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  mask?: MaskType;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
}

/**
 * Aplica máscara de telefone: (__) _____-____
 */
function applyPhoneMask(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Aplica máscara de placa: ___-____
 */
function applyPlateMask(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
}

/**
 * Aplica máscara de CPF/CNPJ: 000.000.000-00 ou 00.000.000/0000-00
 */
function applyCpfCnpjMask(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  } else {
    // CNPJ: 00.000.000/0000-00
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
}

/**
 * Aplica máscara de Placa ou Chassi: ABC-1234 ou 9BWZZZ377VT004251 (17 caracteres)
 */
function applyPlacaChassiMask(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Se tiver até 7 caracteres, trata como placa: ABC-1234
  if (cleaned.length <= 7) {
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
  }
  
  // Se tiver mais de 7, trata como chassi (sem formatação, apenas uppercase)
  return cleaned.slice(0, 17); // Chassi tem 17 caracteres
}

/**
 * Aplica máscara de ano fabricação/modelo: 0000/0000
 */
function applyAnoFabModMask(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  if (numbers.length <= 4) return numbers;
  return `${numbers.slice(0, 4)}/${numbers.slice(4, 8)}`;
}

/**
 * Aplica máscara de moeda brasileira: 1.234,56
 */
function applyCurrencyMask(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (!numbers) return '';
  
  // Converte para número (em centavos)
  const amount = parseInt(numbers, 10);
  
  // Divide por 100 para obter o valor real
  const reais = Math.floor(amount / 100);
  const centavos = amount % 100;
  
  // Formata os reais com separador de milhares
  const reaisFormatted = reais.toLocaleString('pt-BR');
  
  // Formata os centavos com 2 dígitos
  const centavosFormatted = centavos.toString().padStart(2, '0');
  
  return `${reaisFormatted},${centavosFormatted}`;
}

/**
 * Remove a máscara de moeda e retorna apenas os dígitos
 */
export function unmaskCurrency(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Converte valor mascarado de moeda para número
 */
export function currencyToNumber(value: string): number {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return 0;
  return parseInt(numbers, 10) / 100;
}

/**
 * Converte número para formato de moeda mascarado (1234.56 -> "1.234,56")
 */
export function numberToCurrency(value: number): string {
  const centavos = Math.round(value * 100);
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  
  const reaisFormatted = reais.toLocaleString('pt-BR');
  const centavosFormatted = cents.toString().padStart(2, '0');
  
  return `${reaisFormatted},${centavosFormatted}`;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, label, mask = 'none', value, onChange, error, helperText, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    const [displayValue, setDisplayValue] = React.useState(value || '');

    // Sincroniza o valor externo com a máscara aplicada
    React.useEffect(() => {
      if (value !== undefined) {
        let maskedValue = value;
        if (mask === 'phone') {
          maskedValue = applyPhoneMask(value);
        } else if (mask === 'plate') {
          maskedValue = applyPlateMask(value);
        } else if (mask === 'cpfCnpj') {
          maskedValue = applyCpfCnpjMask(value);
        } else if (mask === 'placaChassi') {
          maskedValue = applyPlacaChassiMask(value);
        } else if (mask === 'currency') {
          maskedValue = applyCurrencyMask(value);
        } else if (mask === 'anoFabMod') {
          maskedValue = applyAnoFabModMask(value);
        }
        setDisplayValue(maskedValue);
      }
    }, [value, mask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Aplicar máscara
      if (mask === 'phone') {
        newValue = applyPhoneMask(newValue);
      } else if (mask === 'plate') {
        newValue = applyPlateMask(newValue);
      } else if (mask === 'cpfCnpj') {
        newValue = applyCpfCnpjMask(newValue);
      } else if (mask === 'placaChassi') {
        newValue = applyPlacaChassiMask(newValue);
      } else if (mask === 'currency') {
        newValue = applyCurrencyMask(newValue);
      } else if (mask === 'anoFabMod') {
        newValue = applyAnoFabModMask(newValue);
      }

      setDisplayValue(newValue);
      onChange?.(newValue);
    };

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
            required={props.required}
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
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-700 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MaskedInput.displayName = "MaskedInput";
