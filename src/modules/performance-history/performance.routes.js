import { Router } from 'express';

import {
  getLastPerformedHandler,
  getPerformanceCountsHandler,
} from './performance.controller.js';

const router = Router();

// Read endpoints
router.post('/last-performed', getLastPerformedHandler);
router.post('/counts', getPerformanceCountsHandler);

export default router;  