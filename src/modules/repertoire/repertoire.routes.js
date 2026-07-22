import { Router } from 'express';

import validate from '../../shared/middleware/validate.js';
import requireAuth from '../../shared/middleware/requireAuth.js';
import requireRole from '../../shared/middleware/requireRole.js';
import { createSongSchema, updateSongSchema } from './repertoire.schemas.js';
import {
  createSongHandler,
  listSongsHandler,
  getSongHandler,
  updateSongHandler,
  deleteSongHandler,
} from './repertoire.controller.js';

const router = Router();

router.use(requireAuth);

// Anyone authenticated can browse/view repertoire
router.get('/', requireAuth, listSongsHandler);
router.get('/:id', requireAuth, getSongHandler);

const requireManager = requireRole('ADMINISTRATOR', 'CHOIR_DIRECTOR');
// Only directors/admins can add, edit, or remove songs
router.post('/', requireManager, validate(createSongSchema), createSongHandler);
router.patch('/:id', requireManager, validate(updateSongSchema), updateSongHandler);
router.delete('/:id', requireManager, deleteSongHandler);

export default router;