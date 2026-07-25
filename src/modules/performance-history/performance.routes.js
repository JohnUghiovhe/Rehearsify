import { Router } from 'express';

import {
  getLastPerformedHandler,
  getPerformanceCountsHandler,
} from './performance.controller.js';

import requireAuth from '../../shared/middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

// Read endpoints
router.post('/last-performed', getLastPerformedHandler);
router.post('/counts', getPerformanceCountsHandler);

export default router;
