import type { Kysely } from 'kysely';
import { CustomNameRegistryRepository } from '../models/CustomNameRegistryRepository.js';
import { detectInstallment } from '../utils/installment-detector.js';

export interface ExpenseMatchData {
  title: string;
  amount: number;
  vendor: string;
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

export interface SaveCustomNameData extends ExpenseMatchData {
  customName: string;
}

/**
 * Service for matching and saving custom names for recurring installment expenses
 */
export class CustomNameService {
  private repository: CustomNameRegistryRepository;

  constructor(private db: Kysely<any>) {
    this.repository = new CustomNameRegistryRepository(db);
  }

  /**
   * Find a matching custom name for an expense
   * Returns the custom name if a match is found, null otherwise
   *
   * Matching criteria:
   * - Vendor pattern must match
   * - Installment total must match
   * - Amount must match (exact)
   * - Returns null if multiple potential matches exist (conflict)
   */
  async findMatchingCustomName(expense: ExpenseMatchData): Promise<string | null> {
    // Only match installment expenses
    if (!expense.installmentTotal || !expense.installmentCurrent) {
      return null;
    }

    // Look up in registry by vendor, installment_total, and amount
    const entry = await this.repository.findByPattern(
      expense.vendor,
      expense.installmentTotal,
      expense.amount
    );

    if (!entry) {
      return null;
    }

    return entry.customName;
  }

  /**
   * Save a custom name for an installment expense
   * Only saves for expenses with valid installment patterns
   */
  async saveCustomName(data: SaveCustomNameData): Promise<void> {
    // Only save for installment expenses
    if (!data.installmentTotal || !data.installmentCurrent) {
      // Silent skip for non-installment expenses
      return;
    }

    // Upsert the custom name entry
    await this.repository.upsert({
      vendorPattern: data.vendor,
      installmentTotal: data.installmentTotal,
      amount: data.amount,
      customName: data.customName,
    });
  }

  /**
   * Process an expense title and try to find/apply a custom name
   * This is the main entry point for auto-applying custom names during import
   */
  async processExpense(
    title: string,
    amount: number,
    vendor: string
  ): Promise<string | null> {
    // Detect installment pattern
    const installment = detectInstallment(title);

    if (!installment) {
      return null;
    }

    // Try to find matching custom name
    return this.findMatchingCustomName({
      title,
      amount,
      vendor,
      installmentCurrent: installment.current,
      installmentTotal: installment.total,
    });
  }
}
