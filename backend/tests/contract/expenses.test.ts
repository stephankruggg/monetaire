import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { seedCategories } from '../setup.js';
import { expenseRepository } from '../../src/models/ExpenseRepository.js';

describe('GET /api/expenses - Contract Tests', () => {
  beforeEach(async () => {
    await seedCategories();
  });

  it('should return empty list when no expenses exist', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.expenses).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should return list of expenses', async () => {
    // Create test expenses
    await expenseRepository.create({
      date: '2025-10-10',
      originalTitle: 'Test Expense 1',
      amount: 10.50,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-10-11',
      originalTitle: 'Test Expense 2',
      amount: 25.00,
      paymentType: 'debit',
      source: 'manual',
      vendorName: 'Vendor B',
    });

    const response = await request(app)
      .get('/api/expenses')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.expenses).toHaveLength(2);
    expect(response.body.total).toBe(2);
    expect(response.body.expenses[0]).toHaveProperty('id');
    expect(response.body.expenses[0]).toHaveProperty('date');
    expect(response.body.expenses[0]).toHaveProperty('originalTitle');
    expect(response.body.expenses[0]).toHaveProperty('amount');
    expect(response.body.expenses[0]).toHaveProperty('paymentType');
    expect(response.body.expenses[0]).toHaveProperty('vendorName');
  });

  it('should filter expenses by date range', async () => {
    await expenseRepository.create({
      date: '2025-10-05',
      originalTitle: 'Early',
      amount: 10,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-10-15',
      originalTitle: 'Middle',
      amount: 20,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor B',
    });
    await expenseRepository.create({
      date: '2025-10-25',
      originalTitle: 'Late',
      amount: 30,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor C',
    });

    const response = await request(app)
      .get('/api/expenses')
      .query({ startDate: '2025-10-10', endDate: '2025-10-20' })
      .expect(200);

    expect(response.body.expenses).toHaveLength(1);
    expect(response.body.expenses[0].originalTitle).toBe('Middle');
  });

  it('should filter expenses by vendor', async () => {
    await expenseRepository.create({
      date: '2025-10-10',
      originalTitle: 'Amazon Purchase',
      amount: 10,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Amazon',
    });
    await expenseRepository.create({
      date: '2025-10-11',
      originalTitle: 'iFood Order',
      amount: 20,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'iFood',
    });

    const response = await request(app)
      .get('/api/expenses')
      .query({ vendor: 'Amazon' })
      .expect(200);

    expect(response.body.expenses).toHaveLength(1);
    expect(response.body.expenses[0].vendorName).toBe('Amazon');
  });

  it('should filter expenses by payment type', async () => {
    await expenseRepository.create({
      date: '2025-10-10',
      originalTitle: 'Credit Card',
      amount: 10,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-10-11',
      originalTitle: 'Debit Card',
      amount: 20,
      paymentType: 'debit',
      source: 'imported',
      vendorName: 'Vendor B',
    });

    const response = await request(app)
      .get('/api/expenses')
      .query({ paymentType: 'debit' })
      .expect(200);

    expect(response.body.expenses).toHaveLength(1);
    expect(response.body.expenses[0].paymentType).toBe('debit');
  });

  it('should sort expenses by date descending by default', async () => {
    await expenseRepository.create({
      date: '2025-10-10',
      originalTitle: 'First',
      amount: 10,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-10-15',
      originalTitle: 'Second',
      amount: 20,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor B',
    });

    const response = await request(app)
      .get('/api/expenses')
      .expect(200);

    expect(response.body.expenses[0].originalTitle).toBe('Second');
    expect(response.body.expenses[1].originalTitle).toBe('First');
  });

  it('should sort expenses by amount ascending', async () => {
    await expenseRepository.create({
      date: '2025-10-10',
      originalTitle: 'Expensive',
      amount: 100,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-10-11',
      originalTitle: 'Cheap',
      amount: 10,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor B',
    });

    const response = await request(app)
      .get('/api/expenses')
      .query({ sortBy: 'amount', sortOrder: 'asc' })
      .expect(200);

    expect(response.body.expenses[0].originalTitle).toBe('Cheap');
    expect(response.body.expenses[1].originalTitle).toBe('Expensive');
  });

  it('should return 400 for invalid date format', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .query({ startDate: 'invalid-date' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid payment type', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .query({ paymentType: 'invalid' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should filter expenses by month and year', async () => {
    // Create expenses in different months
    await expenseRepository.create({
      date: '2025-10-15',
      originalTitle: 'October Expense',
      amount: 100,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-11-15',
      originalTitle: 'November Expense 1',
      amount: 200,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor B',
    });
    await expenseRepository.create({
      date: '2025-11-20',
      originalTitle: 'November Expense 2',
      amount: 150,
      paymentType: 'debit',
      source: 'imported',
      vendorName: 'Vendor C',
    });

    const response = await request(app)
      .get('/api/expenses')
      .query({ month: 11, year: 2025 })
      .expect(200);

    expect(response.body.expenses).toHaveLength(2);
    expect(response.body.expenses.every((e: any) => e.date.startsWith('2025-11'))).toBe(true);
  });

  it('should filter expenses by year only', async () => {
    await expenseRepository.create({
      date: '2024-11-15',
      originalTitle: '2024 Expense',
      amount: 100,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor A',
    });
    await expenseRepository.create({
      date: '2025-01-15',
      originalTitle: '2025 Expense 1',
      amount: 200,
      paymentType: 'credit',
      source: 'imported',
      vendorName: 'Vendor B',
    });
    await expenseRepository.create({
      date: '2025-11-15',
      originalTitle: '2025 Expense 2',
      amount: 150,
      paymentType: 'debit',
      source: 'imported',
      vendorName: 'Vendor C',
    });

    const response = await request(app)
      .get('/api/expenses')
      .query({ year: 2025 })
      .expect(200);

    expect(response.body.expenses).toHaveLength(2);
    expect(response.body.expenses.every((e: any) => e.date.startsWith('2025'))).toBe(true);
  });

  it('should return 400 for invalid month', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .query({ month: 13, year: 2025 })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid year', async () => {
    const response = await request(app)
      .get('/api/expenses')
      .query({ month: 11, year: 1999 })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
