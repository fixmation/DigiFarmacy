/**
 * Health check APIs for diagnostics
 */
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Returns server health status
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /api/health
 * API health check
 */
router.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
