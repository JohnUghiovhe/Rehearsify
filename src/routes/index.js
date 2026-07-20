// Mounts every module's router at its prefix.
// Per the Build Guide: "This is the only file that needs to know all six
// modules exist." No other file should import multiple modules' routers.

import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import repertoireRoutes from '../modules/repertoire/repertoire.routes.js';
import schedulingRoutes from '../modules/scheduling/scheduling.routes.js';
import performanceRoutes from '../modules/performance-history/performance.routes.js';
import recommendationRoutes from '../modules/recommendation/recommendation.routes.js';
import planningRoutes from '../modules/planning-reporting/planning.routes.js';

const router = Router();

router.get('/health', async (req, res) =>{
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'reachable' });
    } catch(err) {
        res.status(503).json({ status: 'error', database: 'unreachable', error: err.message });
    }
});

router.use('/auth', authRoutes);
router.use('/songs', repertoireRoutes);
router.use('/services', schedulingRoutes);
router.use('/performances', performanceRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/plans', planningRoutes);

export default router;