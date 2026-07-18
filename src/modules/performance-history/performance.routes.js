import { Router } from 'express';

const router = Router();

// TODO: mostly internal — logPerformances fires on confirm, not a manual POST.
// Expose read endpoints as needed (e.g. GET /performances/:songId)

router.get('/', (req, res) => {
  res.status(501).json({ error: { message: 'performance routes not implemented yet' } });
});

export default router;