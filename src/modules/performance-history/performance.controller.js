// Thin HTTP layer for performance-history read endpoints.

// Thin HTTP layer for performance-history.
// Calls performance.service.js and shapes responses.

import * as service from './performance.service.js';

export async function getLastPerformedHandler(req, res, next) {
  try {
    const { songIds } = req.body;

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
    const { songIds } = req.body;

    const result = await service.getPerformanceCounts(songIds);

    res.status(200).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
}