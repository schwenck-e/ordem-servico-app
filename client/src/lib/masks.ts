/**
 * Input Masks and Formatters
 * Formatting functions for CPF, CNPJ, Phone, and CEP.
 */

export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCpf(value: string): string {
  const digits = unmask(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function maskCnpj(value: string): string {
  const digits = unmask(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export function maskDocument(value: string): string {
  const digits = unmask(value);
  if (digits.length <= 11) {
    return maskCpf(digits);
  }
  return maskCnpj(digits);
}

export function maskPhone(value: string): string {
  const digits = unmask(value).slice(0, 11);
  if (digits.length <= 10) {
    // (XX) XXXX-XXXX
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^(\(\d{2}\)\s\d{4})(\d)/, '$1-$2');
  }
  // (XX) XXXXX-XXXX
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/^(\(\d{2}\)\s\d{5})(\d)/, '$1-$2');
}

export function maskCep(value: string): string {
  const digits = unmask(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}
