import { Router } from 'express';
import multer from 'multer';
import { uploadCSV, getImportSessions, deleteImportSession } from '../controllers/ImportController.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// POST /api/import/csv
router.post('/csv', upload.single('file'), uploadCSV);

// GET /api/import/sessions
router.get('/sessions', getImportSessions);

// DELETE /api/import/:sessionId
router.delete('/:sessionId', deleteImportSession);

export default router;
