import { describe, it, expect } from 'vitest';
import { parseNubankCSV } from '../../src/utils/csv-parser.js';

describe('CSV Parser', () => {
  it('should parse valid Nubank CSV with basic fields', async () => {
    const csvContent = `date,title,amount
2025-10-10,Test Expense,10.50
2025-10-11,Another Expense,25.00`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(2);
    expect(result.expenses[0]).toMatchObject({
      date: '2025-10-10',
      title: 'Test Expense',
      amount: 10.50,
    });
    expect(result.expenses[1]).toMatchObject({
      date: '2025-10-11',
      title: 'Another Expense',
      amount: 25.00,
    });
    expect(result.errors).toHaveLength(0);
  });

  it('should handle escaped quotes in CSV titles', async () => {
    const csvContent = `date,title,amount
2025-10-10,"IOF de ""Rch-Kagi.Com""",1.94`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].title).toBe('IOF de "Rch-Kagi.Com"');
  });

  it('should detect installment patterns', async () => {
    const csvContent = `date,title,amount
2025-09-11,Amazon Marketplace - Parcela 2/3,33.39
2025-09-24,Shopping Iguatemi - Parcela 1/5,193.99`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses[0].installmentCurrent).toBe(2);
    expect(result.expenses[0].installmentTotal).toBe(3);
    expect(result.expenses[1].installmentCurrent).toBe(1);
    expect(result.expenses[1].installmentTotal).toBe(5);
  });

  it('should extract vendor names from titles', async () => {
    const csvContent = `date,title,amount
2025-10-10,Mp *Wshpatinetes,10.27
2025-10-04,iFood - NuPay,25.98
2025-09-11,Amazon Marketplace - Parcela 2/3,33.39`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses[0].vendorName).toBe('Mp *Wshpatinetes');
    expect(result.expenses[1].vendorName).toBe('iFood');
    expect(result.expenses[2].vendorName).toBe('Amazon Marketplace');
  });

  it('should reject CSV with missing required columns', async () => {
    const csvContent = `date,amount
2025-10-10,10.50`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Missing required column');
  });

  it('should reject rows with invalid date format', async () => {
    const csvContent = `date,title,amount
10/10/2025,Test,10.50`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Invalid date');
  });

  it('should reject rows with non-numeric amount', async () => {
    const csvContent = `date,title,amount
2025-10-10,Test,abc`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Invalid amount');
  });

  it('should handle negative amounts (refunds)', async () => {
    const csvContent = `date,title,amount
2025-09-20,Pagamento recebido,-1900.00`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].amount).toBe(-1900.00);
  });

  it('should skip header row and parse multiple expenses', async () => {
    const csvContent = `date,title,amount
2025-10-10,Expense 1,10.00
2025-10-11,Expense 2,20.00
2025-10-12,Expense 3,30.00`;

    const result = await parseNubankCSV(csvContent);

    expect(result.expenses).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });
});
