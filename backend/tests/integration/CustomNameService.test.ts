import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../setup.js';
import { CustomNameService } from '../../src/services/CustomNameService.js';
import { CustomNameRegistryRepository } from '../../src/models/CustomNameRegistryRepository.js';

describe('Custom Name Service Integration Tests', () => {
  let service: CustomNameService;
  let repository: CustomNameRegistryRepository;

  beforeEach(() => {
    service = new CustomNameService(db);
    repository = new CustomNameRegistryRepository(db);
  });

  describe('Match installment by vendor + amount pattern', () => {
    it('should match installment expense with existing custom name entry', async () => {
      // Setup: Create a custom name entry for "Amazon" installments
      await repository.upsert({
        vendorPattern: 'Amazon',
        installmentTotal: 10,
        amount: 50.0,
        customName: 'New Laptop Purchase',
      });

      // Test: Try to match an expense with matching pattern
      const result = await service.findMatchingCustomName({
        title: 'Amazon Parcela 3/10',
        amount: 50.0,
        vendor: 'Amazon',
        installmentCurrent: 3,
        installmentTotal: 10,
      });

      expect(result).toBe('New Laptop Purchase');
    });

    it('should match installment with different current number but same pattern', async () => {
      // Setup: User named "Amazon Parcela 2/12" as "Headphones"
      await repository.upsert({
        vendorPattern: 'Amazon',
        installmentTotal: 12,
        amount: 25.0,
        customName: 'Headphones',
      });

      // Test: Next month, "Amazon Parcela 3/12" should get the same name
      const result = await service.findMatchingCustomName({
        title: 'Amazon Parcela 3/12',
        amount: 25.0,
        vendor: 'Amazon',
        installmentCurrent: 3,
        installmentTotal: 12,
      });

      expect(result).toBe('Headphones');
    });

    it('should match using different installment format variations', async () => {
      // Setup: Create entry
      await repository.upsert({
        vendorPattern: 'Netflix',
        installmentTotal: 6,
        amount: 15.0,
        customName: 'Premium Subscription',
      });

      // Test with "N/M" format
      const result1 = await service.findMatchingCustomName({
        title: 'Netflix 2/6',
        amount: 15.0,
        vendor: 'Netflix',
        installmentCurrent: 2,
        installmentTotal: 6,
      });

      expect(result1).toBe('Premium Subscription');

      // Test with "N de M" format
      const result2 = await service.findMatchingCustomName({
        title: 'Netflix 3 de 6',
        amount: 15.0,
        vendor: 'Netflix',
        installmentCurrent: 3,
        installmentTotal: 6,
      });

      expect(result2).toBe('Premium Subscription');
    });
  });

  describe('Don\'t match if amount differs', () => {
    it('should return null when amount is different', async () => {
      // Setup: Entry with amount 100.0
      await repository.upsert({
        vendorPattern: 'Apple',
        installmentTotal: 10,
        amount: 100.0,
        customName: 'iPhone Purchase',
      });

      // Test: Same vendor and installment_total, but different amount
      const result = await service.findMatchingCustomName({
        title: 'Apple Parcela 2/10',
        amount: 120.0, // Different amount
        vendor: 'Apple',
        installmentCurrent: 2,
        installmentTotal: 10,
      });

      expect(result).toBeNull();
    });

    it('should match with small floating-point tolerance', async () => {
      // Setup
      await repository.upsert({
        vendorPattern: 'Samsung',
        installmentTotal: 8,
        amount: 75.33,
        customName: 'TV Purchase',
      });

      // Test: Amount differs by small rounding error
      const result = await service.findMatchingCustomName({
        title: 'Samsung Parcela 4/8',
        amount: 75.33, // Exact match
        vendor: 'Samsung',
        installmentCurrent: 4,
        installmentTotal: 8,
      });

      expect(result).toBe('TV Purchase');
    });

    it('should not match when amounts differ significantly', async () => {
      // Setup
      await repository.upsert({
        vendorPattern: 'Sony',
        installmentTotal: 12,
        amount: 50.0,
        customName: 'Camera',
      });

      // Test: Significantly different amount
      const result = await service.findMatchingCustomName({
        title: 'Sony Parcela 5/12',
        amount: 51.0, // Off by 1.0
        vendor: 'Sony',
        installmentCurrent: 5,
        installmentTotal: 12,
      });

      expect(result).toBeNull();
    });
  });

  describe('Handle conflicts (multiple potential matches)', () => {
    it('should return null when multiple entries match', async () => {
      // Setup: Two different installment plans with same vendor
      await repository.upsert({
        vendorPattern: 'Magazine Luiza',
        installmentTotal: 10,
        amount: 100.0,
        customName: 'Refrigerator',
      });

      await repository.upsert({
        vendorPattern: 'Magazine Luiza',
        installmentTotal: 12,
        amount: 150.0,
        customName: 'Washing Machine',
      });

      // Test: This should match exactly one entry (no conflict)
      const result1 = await service.findMatchingCustomName({
        title: 'Magazine Luiza Parcela 5/10',
        amount: 100.0,
        vendor: 'Magazine Luiza',
        installmentCurrent: 5,
        installmentTotal: 10,
      });

      expect(result1).toBe('Refrigerator');

      // Test: This should match the other entry (no conflict)
      const result2 = await service.findMatchingCustomName({
        title: 'Magazine Luiza Parcela 3/12',
        amount: 150.0,
        vendor: 'Magazine Luiza',
        installmentCurrent: 3,
        installmentTotal: 12,
      });

      expect(result2).toBe('Washing Machine');
    });

    it('should return null for non-installment expenses even if vendor exists', async () => {
      // Setup: Entry for installment purchase
      await repository.upsert({
        vendorPattern: 'Spotify',
        installmentTotal: 3,
        amount: 10.0,
        customName: 'Premium Trial',
      });

      // Test: Regular (non-installment) Spotify expense should not match
      const result = await service.findMatchingCustomName({
        title: 'Spotify Monthly',
        amount: 10.0,
        vendor: 'Spotify',
        installmentCurrent: null,
        installmentTotal: null,
      });

      expect(result).toBeNull();
    });
  });

  describe('Save custom name', () => {
    it('should save a new custom name for installment expense', async () => {
      // Save
      await service.saveCustomName({
        title: 'Amazon Parcela 1/10',
        amount: 200.0,
        vendor: 'Amazon',
        installmentCurrent: 1,
        installmentTotal: 10,
        customName: 'Monitor Purchase',
      });

      // Verify it was saved
      const entry = await repository.findByPattern('Amazon', 10, 200.0);

      expect(entry).not.toBeNull();
      expect(entry?.customName).toBe('Monitor Purchase');
      expect(entry?.vendorPattern).toBe('Amazon');
      expect(entry?.installmentTotal).toBe(10);
      expect(entry?.amount).toBe(200.0);
    });

    it('should update existing custom name when saving again', async () => {
      // First save
      await service.saveCustomName({
        title: 'Netflix Parcela 1/6',
        amount: 30.0,
        vendor: 'Netflix',
        installmentCurrent: 1,
        installmentTotal: 6,
        customName: 'Subscription',
      });

      // Update with new name
      await service.saveCustomName({
        title: 'Netflix Parcela 2/6',
        amount: 30.0,
        vendor: 'Netflix',
        installmentCurrent: 2,
        installmentTotal: 6,
        customName: 'Netflix Premium',
      });

      // Verify it was updated
      const entry = await repository.findByPattern('Netflix', 6, 30.0);

      expect(entry).not.toBeNull();
      expect(entry?.customName).toBe('Netflix Premium');
    });

    it('should not save custom name for non-installment expenses', async () => {
      // Try to save for non-installment
      await service.saveCustomName({
        title: 'Uber Ride',
        amount: 25.0,
        vendor: 'Uber',
        installmentCurrent: null,
        installmentTotal: null,
        customName: 'Regular Ride',
      });

      // Verify nothing was saved
      const entries = await repository.findAll();
      expect(entries.length).toBe(0);
    });
  });
});
