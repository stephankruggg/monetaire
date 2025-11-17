import { parse } from 'csv-parse/sync';

export interface ParsedExpense {
  date: string;
  title: string;
  amount: number;
  vendorName: string;
  installmentCurrent?: number;
  installmentTotal?: number;
}

export interface CSVParseResult {
  expenses: ParsedExpense[];
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Regex to detect installment pattern: "Vendor - Parcela X/Y"
const INSTALLMENT_PATTERN = /^(.+?)\s*-\s*Parcela\s+(\d+)\/(\d+)$/i;

// Extract vendor name from title
function extractVendorName(title: string): string {
  // Check if it's an installment
  const installmentMatch = title.match(INSTALLMENT_PATTERN);
  if (installmentMatch) {
    return installmentMatch[1].trim();
  }

  // Remove " - NuPay" suffix if present
  let vendor = title.replace(/\s*-\s*NuPay\s*$/i, '');

  // Remove leading "IOF de" if present
  vendor = vendor.replace(/^IOF\s+de\s+"?(.+?)"?$/i, '$1');

  return vendor.trim();
}

// Detect installment pattern and extract current/total
function detectInstallment(title: string): { current?: number; total?: number } {
  const match = title.match(INSTALLMENT_PATTERN);
  if (match) {
    return {
      current: parseInt(match[2], 10),
      total: parseInt(match[3], 10),
    };
  }
  return {};
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export async function parseNubankCSV(csvContent: string): Promise<CSVParseResult> {
  const result: CSVParseResult = {
    expenses: [],
    errors: [],
  };

  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Validate required columns
    if (records.length > 0) {
      const firstRecord = records[0];
      const requiredColumns = ['date', 'title', 'amount'];
      const missingColumns = requiredColumns.filter(col => !(col in firstRecord));

      if (missingColumns.length > 0) {
        result.errors.push({
          row: 0,
          error: `Missing required columns: ${missingColumns.join(', ')}`,
        });
        return result;
      }
    }

    // Process each record
    records.forEach((record: any, index: number) => {
      const rowNumber = index + 2; // +2 because: +1 for header, +1 for 0-index

      try {
        // Validate date
        if (!isValidDate(record.date)) {
          result.errors.push({
            row: rowNumber,
            error: `Invalid date format: ${record.date}. Expected YYYY-MM-DD`,
          });
          return;
        }

        // Validate amount
        const amount = parseFloat(record.amount);
        if (isNaN(amount)) {
          result.errors.push({
            row: rowNumber,
            error: `Invalid amount: ${record.amount}. Expected numeric value`,
          });
          return;
        }

        // Extract vendor and installment info
        const vendorName = extractVendorName(record.title);
        const installment = detectInstallment(record.title);

        // Create parsed expense
        const expense: ParsedExpense = {
          date: record.date,
          title: record.title,
          amount,
          vendorName,
        };

        // Add installment info if present
        if (installment.current !== undefined) {
          expense.installmentCurrent = installment.current;
        }
        if (installment.total !== undefined) {
          expense.installmentTotal = installment.total;
        }

        result.expenses.push(expense);
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error parsing row',
        });
      }
    });
  } catch (error) {
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Failed to parse CSV',
    });
  }

  return result;
}
