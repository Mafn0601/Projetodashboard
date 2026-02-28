// lib/validation.ts

/**
 * Validação de campos
 */

export type ValidationResult = {
  isValid: boolean;
  error?: string;
};

export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} é obrigatório`
    };
  }
  return { isValid: true };
}

export function validateEmail(value: string | undefined | null): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true }; // Email não é obrigatório neste contexto
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      error: 'Email inválido'
    };
  }
  return { isValid: true };
}

export function validatePhoneFormat(value: string | undefined | null): ValidationResult {
  if (!value) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  if (numbers.length !== 11) {
    return {
      isValid: false,
      error: 'Telefone deve ter 11 dígitos'
    };
  }

  return { isValid: true };
}

export function validatePlateFormat(value: string | undefined | null): ValidationResult {
  if (!value) {
    return { isValid: false, error: 'Placa é obrigatória' };
  }

  // Remove tudo que não é alfanumérico
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Placa formato: ABC-1234 (7 caracteres)
  if (cleaned.length !== 7) {
    return {
      isValid: false,
      error: 'Placa deve ter formato válido (ABC-1234)'
    };
  }

  return { isValid: true };
}

export function validateCpfCnpjFormat(value: string | undefined | null): ValidationResult {
  if (!value) {
    return { isValid: false, error: 'CPF/CNPJ é obrigatório' };
  }

  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // CPF tem 11 dígitos, CNPJ tem 14 dígitos
  if (numbers.length !== 11 && numbers.length !== 14) {
    return {
      isValid: false,
      error: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos'
    };
  }

  return { isValid: true };
}

export function validatePlacaChassiFormat(value: string | undefined | null): ValidationResult {
  if (!value) {
    return { isValid: false, error: 'Placa/Chassi é obrigatório' };
  }

  // Remove tudo que não é alfanumérico
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Placa: 7 caracteres (ABC1234)
  // Chassi: 17 caracteres
  if (cleaned.length !== 7 && cleaned.length !== 17) {
    return {
      isValid: false,
      error: 'Placa deve ter 7 caracteres (ABC-1234) ou Chassi 17 caracteres'
    };
  }

  return { isValid: true };
}

export function validateDate(value: string | undefined | null): ValidationResult {
  if (!value) {
    return { isValid: false, error: 'Data de agendamento é obrigatória' };
  }

  // value vem no formato YYYY-MM-DD
  const parts = value.split('-');
  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Data inválida'
    };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // mês é 0-indexed
  const day = parseInt(parts[2], 10);

  const selectedDate = new Date(year, month, day);
  if (isNaN(selectedDate.getTime())) {
    return {
      isValid: false,
      error: 'Data inválida'
    };
  }

  // não permitir data anterior a hoje (comparação apenas de data, sem hora)
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (selectedDate < todayDate) {
    return {
      isValid: false,
      error: 'Data não pode ser anterior à de hoje'
    };
  }

  return { isValid: true };
}

/**
 * Valida múltiplos campos obrigatórios
 */
export function validateRequiredFields(fields: Record<string, string | null | undefined>): Record<string, string | null> {
  const errors: Record<string, string | null> = {};

  Object.entries(fields).forEach(([key, value]) => {
    const result = validateRequired(value, key);
    errors[key] = result.error || null;
  });

  return errors;
}

/**
 * Valida formulário completo
 */
export function validateForm(formData: Record<string, any>): {
  isValid: boolean;
  errors: Record<string, string | null>;
} {
  const errors: Record<string, string | null> = {};

  // Campos obrigatórios
  const requiredFields = [
    'responsavel',
    'parceiro',
    'nomeCliente',
    'emailCliente',
    'cpfCnpj',
    'telefone',
    'placaChassi',
    'tipoAgendamento',
    'tipo',
    'fabricante',
    'modelo',
    'dataAgendamento'
  ];

  requiredFields.forEach(field => {
    const validation = validateRequired(formData[field], field);
    if (!validation.isValid) {
      errors[field] = validation.error || null;
    }
  });

  if (formData.dataAgendamento) {
    const dateValidation = validateDate(formData.dataAgendamento);
    if (!dateValidation.isValid) {
      errors.dataAgendamento = dateValidation.error || null;
    }
  }

  // Validações específicas
  if (formData.email) {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || null;
    }
  }

  if (formData.emailCliente) {
    const emailClienteValidation = validateEmail(formData.emailCliente);
    if (!emailClienteValidation.isValid) {
      errors.emailCliente = emailClienteValidation.error || null;
    }
  }

  if (formData.cpfCnpj) {
    const cpfCnpjValidation = validateCpfCnpjFormat(formData.cpfCnpj);
    if (!cpfCnpjValidation.isValid) {
      errors.cpfCnpj = cpfCnpjValidation.error || null;
    }
  }

  if (formData.placaChassi) {
    const placaChassiValidation = validatePlacaChassiFormat(formData.placaChassi);
    if (!placaChassiValidation.isValid) {
      errors.placaChassi = placaChassiValidation.error || null;
    }
  }

  return {
    isValid: Object.values(errors).every(e => e === null),
    errors
  };
}
