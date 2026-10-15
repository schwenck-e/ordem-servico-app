import { describe, it, expect } from 'vitest';
import { stripNonDigits, validateCpf, validateCnpj } from '../documents';

describe('Common Document Validators', () => {
  describe('stripNonDigits', () => {
    it('deve remover caracteres especiais, letras e espaços', () => {
      expect(stripNonDigits('123.456.789-00')).toBe('12345678900');
      expect(stripNonDigits('11.222.333/0001-81')).toBe('11222333000181');
      expect(stripNonDigits('abc 123 !@# 456')).toBe('123456');
    });
  });

  describe('validateCpf', () => {
    it('deve validar CPFs válidos formatados e não-formatados', () => {
      expect(validateCpf('529.982.247-25')).toBe(true);
      expect(validateCpf('52998224725')).toBe(true);
    });

    it('deve rejeitar CPFs com sequências de dígitos repetidos', () => {
      const repeated = [
        '000.000.000-00',
        '111.111.111-11',
        '222.222.222-22',
        '333.333.333-33',
        '444.444.444-44',
        '555.555.555-55',
        '666.666.666-66',
        '777.777.777-77',
        '888.888.888-88',
        '999.999.999-99',
      ];
      for (const cpf of repeated) {
        expect(validateCpf(cpf)).toBe(false);
      }
    });

    it('deve rejeitar CPFs com comprimento inválido', () => {
      expect(validateCpf('123.456.78-9')).toBe(false);
      expect(validateCpf('123456789012')).toBe(false);
      expect(validateCpf('')).toBe(false);
    });

    it('deve rejeitar CPFs com primeiro ou segundo dígito verificador inválido', () => {
      expect(validateCpf('529.982.247-00')).toBe(false);
      expect(validateCpf('529.982.247-20')).toBe(false);
    });
  });

  describe('validateCnpj', () => {
    it('deve validar CNPJs válidos formatados e não-formatados', () => {
      expect(validateCnpj('11.222.333/0001-81')).toBe(true);
      expect(validateCnpj('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJs com sequências de dígitos repetidos', () => {
      expect(validateCnpj('00.000.000/0000-00')).toBe(false);
      expect(validateCnpj('11.111.111/1111-11')).toBe(false);
      expect(validateCnpj('22.222.222/2222-22')).toBe(false);
    });

    it('deve rejeitar CNPJs com comprimento inválido', () => {
      expect(validateCnpj('11.222.333/0001-8')).toBe(false);
      expect(validateCnpj('112223330001819')).toBe(false);
      expect(validateCnpj('')).toBe(false);
    });

    it('deve rejeitar CNPJs com dígitos verificadores incorretos', () => {
      expect(validateCnpj('11.222.333/0001-00')).toBe(false);
      expect(validateCnpj('11.222.333/0001-80')).toBe(false);
    });
  });
});
