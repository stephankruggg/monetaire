import { describe, it, expect } from 'vitest';
import { BillingCycleService } from '../../src/services/BillingCycleService.js';

describe('BillingCycleService', () => {
  const service = new BillingCycleService();

  describe('calculateBillingCycle', () => {
    it('should assign expense on close day to current month cycle', () => {
      // Expense on Oct 11 belongs to October cycle (with close day 11)
      const result = service.calculateBillingCycle('2025-10-11', 11);

      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
    });

    it('should assign expense before close day to current month cycle', () => {
      // Expense on Oct 5 belongs to October cycle (with close day 11)
      const result = service.calculateBillingCycle('2025-10-05', 11);

      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
    });

    it('should assign expense after close day to next month cycle', () => {
      // Expense on Oct 12 belongs to November cycle (with close day 11)
      const result = service.calculateBillingCycle('2025-10-12', 11);

      expect(result.month).toBe(11);
      expect(result.year).toBe(2025);
    });

    it('should handle September to October cycle correctly', () => {
      // Expense on Sept 15 belongs to October cycle (close day 11)
      const result = service.calculateBillingCycle('2025-09-15', 11);

      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
    });

    it('should handle end of year cycle rollover', () => {
      // Expense on Dec 12 belongs to January 2026 cycle (close day 11)
      const result = service.calculateBillingCycle('2025-12-12', 11);

      expect(result.month).toBe(1);
      expect(result.year).toBe(2026);
    });

    it('should handle December close day correctly', () => {
      // Expense on Dec 11 belongs to December 2025 cycle (close day 11)
      const result = service.calculateBillingCycle('2025-12-11', 11);

      expect(result.month).toBe(12);
      expect(result.year).toBe(2025);
    });

    it('should work with different close days', () => {
      // Expense on Oct 15 belongs to October cycle (close day 20)
      const result = service.calculateBillingCycle('2025-10-15', 20);

      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
    });

    it('should assign expense after different close day to next month', () => {
      // Expense on Oct 21 belongs to November cycle (close day 20)
      const result = service.calculateBillingCycle('2025-10-21', 20);

      expect(result.month).toBe(11);
      expect(result.year).toBe(2025);
    });

    it('should use default close day of 11 when not specified', () => {
      // Test default parameter
      const result = service.calculateBillingCycle('2025-10-12');

      expect(result.month).toBe(11);
      expect(result.year).toBe(2025);
    });

    it('should handle first day of month correctly', () => {
      // Expense on Oct 1 belongs to October cycle (close day 11)
      const result = service.calculateBillingCycle('2025-10-01', 11);

      expect(result.month).toBe(10);
      expect(result.year).toBe(2025);
    });

    it('should handle last day of month correctly', () => {
      // Expense on Oct 31 belongs to November cycle (close day 11)
      const result = service.calculateBillingCycle('2025-10-31', 11);

      expect(result.month).toBe(11);
      expect(result.year).toBe(2025);
    });
  });

  describe('formatBillingCycle', () => {
    it('should format October 2025 cycle correctly', () => {
      const result = service.formatBillingCycle({ month: 10, year: 2025 });

      expect(result).toBe('Oct 2025 Statement');
    });

    it('should format January cycle correctly', () => {
      const result = service.formatBillingCycle({ month: 1, year: 2026 });

      expect(result).toBe('Jan 2026 Statement');
    });

    it('should format December cycle correctly', () => {
      const result = service.formatBillingCycle({ month: 12, year: 2025 });

      expect(result).toBe('Dec 2025 Statement');
    });
  });

  describe('getBillingCycleDateRange', () => {
    it('should return correct date range for October 2025 cycle', () => {
      // October cycle: Sept 12 - Oct 11 (close day 11)
      const result = service.getBillingCycleDateRange(10, 2025, 11);

      expect(result.startDate).toBe('2025-09-12');
      expect(result.endDate).toBe('2025-10-11');
    });

    it('should return correct date range for January cycle', () => {
      // January cycle: Dec 12 - Jan 11 (close day 11)
      const result = service.getBillingCycleDateRange(1, 2026, 11);

      expect(result.startDate).toBe('2025-12-12');
      expect(result.endDate).toBe('2026-01-11');
    });

    it('should work with different close days', () => {
      // October cycle with close day 20: Sept 21 - Oct 20
      const result = service.getBillingCycleDateRange(10, 2025, 20);

      expect(result.startDate).toBe('2025-09-21');
      expect(result.endDate).toBe('2025-10-20');
    });

    it('should use default close day of 11', () => {
      const result = service.getBillingCycleDateRange(10, 2025);

      expect(result.startDate).toBe('2025-09-12');
      expect(result.endDate).toBe('2025-10-11');
    });
  });
});
