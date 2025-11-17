import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { seedCategories } from '../setup.js';
import { db } from '../../src/db/database.js';

describe('POST /api/import/csv - Contract Tests', () => {
  beforeEach(async () => {
    await seedCategories();
  });

  it('should import valid CSV and return import result', async () => {
    const csvContent = `date,title,amount
2025-10-10,Test Expense,10.50
2025-10-11,Another Expense,25.00`;

    const response = await request(app)
      .post('/api/import/csv')
      .attach('file', Buffer.from(csvContent), 'test.csv')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('sessionId');
    expect(response.body.sessionId).toBeGreaterThan(0);
    expect(response.body.imported).toBe(2);
    expect(response.body.failed).toBe(0);
    expect(response.body.errors).toHaveLength(0);
  });

  it('should handle partial import with errors', async () => {
    const csvContent = `date,title,amount
2025-10-10,Valid Expense,10.50
invalid-date,Bad Expense,25.00`;

    const response = await request(app)
      .post('/api/import/csv')
      .attach('file', Buffer.from(csvContent), 'partial.csv')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.imported).toBe(1);
    expect(response.body.failed).toBe(1);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0]).toHaveProperty('row');
    expect(response.body.errors[0]).toHaveProperty('error');
  });

  it('should return 400 when no file is uploaded', async () => {
    const response = await request(app)
      .post('/api/import/csv')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('file');
  });

  it('should return 400 when file is not CSV', async () => {
    const response = await request(app)
      .post('/api/import/csv')
      .attach('file', Buffer.from('not a csv'), 'test.txt')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should extract month and year from filename', async () => {
    const csvContent = `date,title,amount
2025-10-10,Test,10.50`;

    const response = await request(app)
      .post('/api/import/csv')
      .attach('file', Buffer.from(csvContent), 'Nubank Statement Oct 18 2025.csv')
      .expect(200);

    // Verify import session was created with correct month/year
    const session = await db
      .selectFrom('import_sessions')
      .selectAll()
      .where('id', '=', response.body.sessionId)
      .executeTakeFirst();

    expect(session?.month).toBe(10);
    expect(session?.year).toBe(2025);
  });
});
