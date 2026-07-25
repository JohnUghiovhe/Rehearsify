import { Router } from 'express';

import validate from '../../shared/middleware/validate.js';
import requireAuth from '../../shared/middleware/requireAuth.js';
import requireRole from '../../shared/middleware/requireRole.js';
import { 
  createSongSchema, 
  updateSongSchema, 
  listSongsQuerySchema // 1. Import it here!
} from './repertoire.schemas.js';
import {
  createSongHandler,
  listSongsHandler,
  getSongHandler,
  updateSongHandler,
  deleteSongHandler,
} from './repertoire.controller.js';

const router = Router();

// Protect ALL routes in this file (applies to GET, POST, PATCH, DELETE)
router.use(requireAuth);

// 2. Attach query validation here!
// Notice requireAuth was removed from listSongsHandler/getSongHandler because router.use(requireAuth) already handles it.
router.get('/', validate(listSongsQuerySchema, 'query'), listSongsHandler);
router.get('/:id', getSongHandler);

const requireManager = requireRole('ADMINISTRATOR', 'CHOIR_DIRECTOR');

// Only directors/admins can add, edit, or remove songs
router.post('/', requireManager, validate(createSongSchema), createSongHandler);
router.patch('/:id', requireManager, validate(updateSongSchema), updateSongHandler);
router.delete('/:id', requireManager, deleteSongHandler);

export default router;