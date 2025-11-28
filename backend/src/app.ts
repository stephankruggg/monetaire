import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import importRoutes from './api/routes/import.js';
import expensesRoutes from './api/routes/expenses.js';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security response headers to improve site isolation and general security
app.use((req: Request, res: Response, next: NextFunction) => {
  // Mitigate Spectre-like attacks by enabling cross-origin isolation where possible
  // Note: `Cross-Origin-Embedder-Policy: require-corp` requires cross-origin resources
  // to send appropriate CORP/CORS headers. If you host third-party assets, adjust accordingly.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Common security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', "interest-cohort=()" );

  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/import', importRoutes);
app.use('/api/expenses', expensesRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

export { app };
