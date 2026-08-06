import { Router } from 'express';

import { getRecommendationsHandler } from './recommendation.controller.js';

const router = Router();

/**
 * GET /api/recommendations/:serviceId
 */
router.get('/:serviceId', getRecommendationsHandler);

export default router;