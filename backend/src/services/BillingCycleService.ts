/**
 * BillingCycleService
 *
 * Calculates which billing cycle (credit card statement month) an expense belongs to.
 *
 * Example: If billing cycle closes on the 11th:
 * - Expense on Sept 12 → October billing cycle (Sept 12 - Oct 11)
 * - Expense on Oct 11 → October billing cycle (Sept 12 - Oct 11)
 * - Expense on Oct 12 → November billing cycle (Oct 12 - Nov 11)
 */

export interface BillingCycle {
  month: number;  // 1-12
  year: number;   // YYYY
}

export class BillingCycleService {
  /**
   * Calculate which billing cycle a transaction belongs to
   *
   * @param transactionDate - The date of the transaction (YYYY-MM-DD)
   * @param closeDayOfMonth - The day of month when billing cycle closes (1-31, default: 11)
   * @returns The billing cycle month and year
   */
  calculateBillingCycle(transactionDate: string, closeDayOfMonth: number = 11): BillingCycle {
    // Parse date components directly to avoid timezone issues
    const [yearStr, monthStr, dayStr] = transactionDate.split('-');
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    // If transaction is after close day, it belongs to next month's cycle
    if (day > closeDayOfMonth) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      return {
        month: nextMonth,
        year: nextYear,
      };
    }

    // If transaction is on or before close day, it belongs to current month's cycle
    return {
      month,
      year,
    };
  }

  /**
   * Format billing cycle for display
   *
   * @param cycle - The billing cycle to format
   * @returns Formatted string like "Oct 2025 Statement"
   */
  formatBillingCycle(cycle: BillingCycle): string {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthName = monthNames[cycle.month - 1];
    return `${monthName} ${cycle.year} Statement`;
  }

  /**
   * Get all expenses dates within a billing cycle
   *
   * @param cycleMonth - Billing cycle month (1-12)
   * @param cycleYear - Billing cycle year
   * @param closeDayOfMonth - Day when cycle closes
   * @returns Start and end dates of the billing cycle
   */
  getBillingCycleDateRange(
    cycleMonth: number,
    cycleYear: number,
    closeDayOfMonth: number = 11
  ): { startDate: string; endDate: string } {
    // Billing cycle runs from (previous month close day + 1) to (current month close day)
    const prevMonth = cycleMonth === 1 ? 12 : cycleMonth - 1;
    const prevYear = cycleMonth === 1 ? cycleYear - 1 : cycleYear;

    // Start date: previous month, day after close day
    const startDay = closeDayOfMonth + 1;
    const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

    // End date: current month, close day
    const endDate = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${String(closeDayOfMonth).padStart(2, '0')}`;

    return { startDate, endDate };
  }
}

export const billingCycleService = new BillingCycleService();
