import { Request, Response } from 'express';
import { importCSVExpenses } from '../../services/ImportService.js';
import { importSessionRepository } from '../../models/ImportSessionRepository.js';
import { db } from '../../db/database.js';

// Extract month and year from filename
// Examples: "Nubank Statement Oct 18 2025.csv" -> {month: 10, year: 2025}
function extractMonthYearFromFilename(filename: string): { month: number; year: number } {
  const monthMap: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };

  // Try to extract month name and year
  const monthMatch = filename.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)/);
  const yearMatch = filename.match(/\b(20\d{2})\b/);

  const month = monthMatch ? monthMap[monthMatch[1]] : new Date().getMonth() + 1;
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  return { month, year };
}

export async function uploadCSV(req: Request, res: Response): Promise<void> {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Check file extension
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      res.status(400).json({ error: 'File must be a CSV' });
      return;
    }

    // Check for duplicate import by filename
    console.log('[ImportController] Checking for duplicate import of:', req.file.originalname);
    const existingSession = await importSessionRepository.checkDuplicateImport(req.file.originalname);

    if (existingSession) {
      console.log('[ImportController] Duplicate found - session ID:', existingSession.id);
      res.status(409).json({
        isDuplicate: true,
        existingSession,
        message: 'A file with this name has already been imported',
      });
      return;
    }

    console.log('[ImportController] No duplicate found, proceeding with import');

    // Extract month and year from filename
    const { month, year } = extractMonthYearFromFilename(req.file.originalname);

    // Process CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const result = await importCSVExpenses(csvContent, req.file.originalname, month, year, db);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import CSV',
    });
  }
}

export async function getImportSessions(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const sessions = await importSessionRepository.findAll(limit);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error fetching import sessions:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch import sessions',
    });
  }
}

export async function deleteImportSession(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);

    console.log('[ImportController] Soft deleting import session:', sessionId);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }

    // Soft delete all expenses associated with this import session
    console.log('[ImportController] Soft deleting expenses for session:', sessionId);
    const expensesResult = await db
      .updateTable('expenses')
      .set({
        is_deleted: 1,
        updated_at: new Date().toISOString(),
      })
      .where('import_session_id', '=', sessionId)
      .where('is_deleted', '=', 0) // Only delete non-deleted expenses
      .executeTakeFirst();

    const expensesDeleted = Number(expensesResult.numUpdatedRows || 0);
    console.log('[ImportController] Soft deleted expenses:', expensesDeleted);

    // Soft delete the import session
    console.log('[ImportController] Soft deleting session:', sessionId);
    await importSessionRepository.softDelete(sessionId);

    console.log('[ImportController] Import session soft deleted successfully');

    res.status(200).json({
      message: 'Import session deleted successfully',
      expensesDeleted,
    });
  } catch (error) {
    console.error('Error deleting import session:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete import session',
    });
  }
}
