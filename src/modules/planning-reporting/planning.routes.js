import { Router } from 'express';
import requireAuth from '../../shared/middleware/requireAuth.js';
import {
  fetchServiceHandler,
  createDraftHandler,
  addSongToDraftHandler,
  removeSongFromDraftHandler,
  getDraftHandler,
  deleteDraftHandler,
} from './planning.controller.js';

const router = Router();

router.get('/service/:id', requireAuth, fetchServiceHandler);
router.post('/draft', requireAuth, createDraftHandler);
router.get('/draft/:draftId', requireAuth, getDraftHandler);
router.post('/draft/:draftId/song/:songId', requireAuth, addSongToDraftHandler);
router.delete('/draft/:draftId/song/:songId', requireAuth, removeSongFromDraftHandler);
router.delete('/draft/:draftId', requireAuth, deleteDraftHandler);

export default router;
