// Thin HTTP layer for performance-history read endpoints.

import * as service from './performance.service.js';
import { songIdsSchema } from './performance.schemas.js';

export async function getLastPerformedHandler(req, res, next) {
  try {
    const { songIds } = songIdsSchema.parse(req.body);

    const result = await service.getLastPerformedMap(songIds);

    res.status(200).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPerformanceCountsHandler(req, res, next) {
  try {
    const { songIds } = songIdsSchema.parse(req.body);

    const result = await service.getPerformanceCounts(songIds);

    res.status(200).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
