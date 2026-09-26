/**
 * Brazilian Document Validators (CPF / CNPJ)
 * Ported with mathematical parity from backend validation schemas.
 */

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validates a CPF number using the standard Brazilian algorithm.
 * Expects 11 numeric digits (accepts formatted or unformatted string).
 */
export function validateCpf(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== 11) return false;

  // Reject sequences of identical digits (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // First check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]!, 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9]!, 10)) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]!, 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10]!, 10)) return false;

  return true;
}

/**
 * Validates a CNPJ number using the standard Brazilian algorithm.
 * Expects 14 numeric digits (accepts formatted or unformatted string).
 */
export function validateCnpj(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== 14) return false;

  // Reject sequences of identical digits
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // First check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]!, 10) * weights1[i]!;
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(digits[12]!, 10)) return false;

  // Second check digit
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]!, 10) * weights2[i]!;
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(digits[13]!, 10)) return false;

  return true;
}

/**
 * Validates either a CPF or CNPJ.
 */
export function validateDocument(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length === 11) return validateCpf(digits);
  if (digits.length === 14) return validateCnpj(digits);
  return false;
}
