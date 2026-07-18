import { Router } from 'express';

const router = Router();

// TODO: getServicePlan, updatePlanSongs, confirmPlan, getHealthDashboard
// See PRD PLAN-1, PLAN-2, PLAN-3, RPT-1/2/3

router.get('/', (req, res) => {
  res.status(501).json({ error: { message: 'planning routes not implemented yet' } });
});

export default router;