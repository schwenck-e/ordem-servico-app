/**
 * Utilitários puros para higienização e validação de documentos fiscais brasileiros (CPF e CNPJ).
 */

export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validação de CPF baseada no cálculo oficial de dígitos verificadores em módulo 11.
 * Rejeita valores com tamanho diferente de 11 dígitos ou sequências de dígitos idênticos.
 */
export function validateCpf(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== 11) return false;

  // Rejeita sequências de dígitos idênticos (ex.: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9], 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10], 10)) return false;

  return true;
}

/**
 * Validação de CNPJ baseada no cálculo oficial de dígitos verificadores em módulo 11 com pesos decrescentes.
 * Rejeita valores com tamanho diferente de 14 dígitos ou sequências de dígitos idênticos.
 */
export function validateCnpj(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== 14) return false;

  // Rejeita sequências de dígitos idênticos
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(digits[12], 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(digits[13], 10)) return false;

  return true;
}
