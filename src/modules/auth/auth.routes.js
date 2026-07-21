import { Router } from 'express';

import validate from '../../shared/middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schemas.js';
import { registerHandler, loginHandler } from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);

export default router;