import { db as defaultDb } from '../db/database.js';
import type { Kysely } from 'kysely';

export interface CustomNameRegistryEntry {
  id: number;
  vendorPattern: string;
  installmentTotal: number;
  amount: number;
  customName: string;
  firstAssignedDate: string;
}

export interface CreateCustomNameRegistryData {
  vendorPattern: string;
  installmentTotal: number;
  amount: number;
  customName: string;
}

export class CustomNameRegistryRepository {
  constructor(private db: Kysely<any> = defaultDb) {}

  /**
   * Find a custom name entry by vendor pattern, installment total, and amount
   */
  async findByPattern(
    vendorPattern: string,
    installmentTotal: number,
    amount: number
  ): Promise<CustomNameRegistryEntry | null> {
    const row = await this.db
      .selectFrom('custom_name_registry')
      .selectAll()
      .where('vendor_pattern', '=', vendorPattern)
      .where('installment_total', '=', installmentTotal)
      .where('amount', '=', amount)
      .executeTakeFirst();

    if (!row) return null;

    return this.mapRowToEntry(row);
  }

  /**
   * Find all custom name entries for a vendor pattern
   */
  async findByVendorPattern(vendorPattern: string): Promise<CustomNameRegistryEntry[]> {
    const rows = await this.db
      .selectFrom('custom_name_registry')
      .selectAll()
      .where('vendor_pattern', '=', vendorPattern)
      .execute();

    return rows.map(this.mapRowToEntry);
  }

  /**
   * Create or update a custom name entry
   * If an entry with the same pattern exists, update it
   */
  async upsert(data: CreateCustomNameRegistryData): Promise<number> {
    // Check if entry already exists
    const existing = await this.findByPattern(
      data.vendorPattern,
      data.installmentTotal,
      data.amount
    );

    if (existing) {
      // Update existing entry
      await this.db
        .updateTable('custom_name_registry')
        .set({
          custom_name: data.customName,
        })
        .where('id', '=', existing.id)
        .execute();

      return existing.id;
    }

    // Create new entry
    const result = await this.db
      .insertInto('custom_name_registry')
      .values({
        vendor_pattern: data.vendorPattern,
        installment_total: data.installmentTotal,
        amount: data.amount,
        custom_name: data.customName,
        first_assigned_date: new Date().toISOString(),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return result.id;
  }

  /**
   * Delete a custom name entry by ID
   */
  async delete(id: number): Promise<void> {
    await this.db
      .deleteFrom('custom_name_registry')
      .where('id', '=', id)
      .execute();
  }

  /**
   * Get all custom name entries
   */
  async findAll(): Promise<CustomNameRegistryEntry[]> {
    const rows = await this.db
      .selectFrom('custom_name_registry')
      .selectAll()
      .orderBy('first_assigned_date', 'desc')
      .execute();

    return rows.map(this.mapRowToEntry);
  }

  private mapRowToEntry(row: any): CustomNameRegistryEntry {
    return {
      id: row.id,
      vendorPattern: row.vendor_pattern,
      installmentTotal: row.installment_total,
      amount: row.amount,
      customName: row.custom_name,
      firstAssignedDate: row.first_assigned_date,
    };
  }
}

export const customNameRegistryRepository = new CustomNameRegistryRepository();
