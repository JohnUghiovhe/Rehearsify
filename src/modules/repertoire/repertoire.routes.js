import { Router } from 'express';

const router = Router();

// TODO: add endpoints — see PRD's functional requirements for this module

router.get('/', (req, res) => {
  res.status(501).json({ error: { message: 'repertoire routes not implemented yet' } });
});

export default router;