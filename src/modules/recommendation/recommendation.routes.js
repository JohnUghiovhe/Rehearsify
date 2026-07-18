import { Router } from 'express';

const router = Router();

// GET /api/recommendations/:serviceId -> getRecommendationsForService

router.get('/:serviceId', (req, res) => {
  res.status(501).json({ error: { message: 'recommendation routes not implemented yet' } });
});

export default router;