import { Router } from 'express';

import {
  getLastPerformedHandler,
  getPerformanceCountsHandler,
} from './performance.controller.js';

import requireAuth from '../../shared/middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

// Read endpoints
router.get('/last-performed', getLastPerformedHandler);
router.get('/counts', getPerformanceCountsHandler);

export default router;
