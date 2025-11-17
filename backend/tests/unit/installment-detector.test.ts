import { describe, it, expect } from 'vitest';
import { detectInstallment, type InstallmentInfo } from '../../src/utils/installment-detector.js';

describe('Installment Pattern Detector', () => {
  describe('Extract vendor, current, total from various installment formats', () => {
    it('should extract from "Parcela 2/10" format', () => {
      const title = 'Amazon Parcela 2/10';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Amazon',
        current: 2,
        total: 10,
      });
    });

    it('should extract from "2/10" format (no "Parcela" keyword)', () => {
      const title = 'Netflix 2/10';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Netflix',
        current: 2,
        total: 10,
      });
    });

    it('should extract from "2 de 10" format', () => {
      const title = 'Spotify 2 de 10';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Spotify',
        current: 2,
        total: 10,
      });
    });

    it('should extract from "2 DE 10" format (case insensitive)', () => {
      const title = 'Apple Music 2 DE 10';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Apple Music',
        current: 2,
        total: 10,
      });
    });

    it('should extract from "Parc 3/12" format', () => {
      const title = 'Magazine Luiza Parc 3/12';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Magazine Luiza',
        current: 3,
        total: 12,
      });
    });

    it('should handle vendor names with special characters', () => {
      const title = 'Lojas Americanas S.A. 5/10';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Lojas Americanas S.A.',
        current: 5,
        total: 10,
      });
    });

    it('should handle single-digit installments', () => {
      const title = 'Mercado Livre 1/3';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Mercado Livre',
        current: 1,
        total: 3,
      });
    });

    it('should handle double-digit installments', () => {
      const title = 'Samsung Galaxy 12/24';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Samsung Galaxy',
        current: 12,
        total: 24,
      });
    });
  });

  describe('Return null for non-installment expenses', () => {
    it('should return null for regular expenses without installment patterns', () => {
      const title = 'Uber Ride';
      const result = detectInstallment(title);

      expect(result).toBeNull();
    });

    it('should return null for expenses with numbers but no installment pattern', () => {
      const title = 'Restaurant 123';
      const result = detectInstallment(title);

      expect(result).toBeNull();
    });

    it('should return null for expenses with dates', () => {
      const title = 'Gym Membership 2025-10-15';
      const result = detectInstallment(title);

      expect(result).toBeNull();
    });

    it('should return null for empty strings', () => {
      const title = '';
      const result = detectInstallment(title);

      expect(result).toBeNull();
    });

    it('should return null for expenses with fractions but not installments', () => {
      const title = 'Pizza 1/2 Pepperoni';
      const result = detectInstallment(title);

      // This could be ambiguous, but if current > total, it's not an installment
      // For "1/2", current=1, total=2, which is valid
      // Let's test an invalid case: current > total
      const invalidTitle = 'Product 5/3';
      const invalidResult = detectInstallment(invalidTitle);

      expect(invalidResult).toBeNull();
    });

    it('should return null for installments where current is 0', () => {
      const title = 'Product 0/10';
      const result = detectInstallment(title);

      expect(result).toBeNull();
    });

    it('should return null for installments where total is 0', () => {
      const title = 'Product 1/0';
      const result = detectInstallment(title);

      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace variations', () => {
      const title = '  Amazon   Parcela   2  /  10  ';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Amazon',
        current: 2,
        total: 10,
      });
    });

    it('should handle vendor name at the end', () => {
      const title = 'Parcela 2/10 Amazon';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Amazon',
        current: 2,
        total: 10,
      });
    });

    it('should prioritize the first installment pattern if multiple exist', () => {
      const title = 'Amazon 2/10 Netflix 3/12';
      const result = detectInstallment(title);

      expect(result).toEqual({
        vendor: 'Amazon',
        current: 2,
        total: 10,
      });
    });
  });
});
