
import config from '../../config/index.js';

import * as repertoireService from '../repertoire/repertoire.service.js';
import * as schedulingService from '../scheduling/scheduling.service.js';
import * as performanceService from '../performance-history/performance.service.js';

const {
  choirSkillLevel,
  rotationWindowDays,
} = config.recommendation;

/**
 * Returns the number of days since the song was last performed.
 * Songs never performed return Infinity.
 */
function daysSince(lastPerformed) {
  if (!lastPerformed) return Infinity;

  const now = Date.now();
  const performed = new Date(lastPerformed).getTime();

  return Math.floor((now - performed) / (1000 * 60 * 60 * 24));
}

/**
 * Hard rotation filter.
 * Songs performed within the configured window are excluded.
 */
function isInsideRotationWindow(lastPerformed) {
  if (!lastPerformed) return false;

  return daysSince(lastPerformed) < rotationWindowDays;
}

/**
 * Season scoring.
 */
function getSeasonScore(songSeason, serviceSeason) {
  return songSeason === serviceSeason ? 20 : 0;
}

/**
 * Difficulty scoring.
 * Maximum score when choir skill exactly matches song difficulty.
 */
function getDifficultyScore(songDifficulty) {
  const difference = Math.abs(songDifficulty - choirSkillLevel);

  return Math.max(0, 30 - difference * 10);
}

/**
 * Never-performed bonus.
 */
function getNeverPerformedScore(lastPerformed) {
  return lastPerformed ? 0 : 30;
}

/**
 * Performance count bonus.
 * Less frequently used songs score higher.
 */
function getPerformanceCountScore(count) {
  return Math.max(0, 20 - count * 2);
}

/**
 * Calculates the recommendation score and
 * returns a detailed score breakdown.
 */
function calculateScore(song, service, lastPerformed, performanceCount) {
  const seasonScore = getSeasonScore(
    song.season,
    service.season
  );

  const difficultyScore =
    getDifficultyScore(song.difficulty);

  const neverPerformedScore =
    getNeverPerformedScore(lastPerformed);

  const performanceCountScore =
    getPerformanceCountScore(performanceCount);

  const total =
    seasonScore +
    difficultyScore +
    neverPerformedScore +
    performanceCountScore;

  return {
    total,

    breakdown: {
      season: seasonScore,
      difficulty: difficultyScore,
      neverPerformed: neverPerformedScore,
      performanceCount: performanceCountScore,
    },
  };
}

/**
 * Sorting helper.
 *
 * Sort order:
 * 1. Highest score
 * 2. Least recently performed
 * 3. Lowest performance count
 * 4. Alphabetical title
 */
function compareRecommendations(a, b) {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  const aDays = daysSince(a.lastPerformed);
  const bDays = daysSince(b.lastPerformed);

  if (bDays !== aDays) {
    return bDays - aDays;
  }

  if (a.performanceCount !== b.performanceCount) {
    return a.performanceCount - b.performanceCount;
  }

  return a.title.localeCompare(b.title);
}



export async function getRecommendationsForService(serviceId) {
  // Get service (throws 404 if not found)
  const service = await schedulingService.getService(serviceId);

  // Get all active songs
  const songs = await repertoireService.getAllActiveSongs();

  // Song IDs already attached to this service
  const serviceSongIds = new Set(
    service.performances.map((performance) => performance.songId)
  );

  // Remove songs already on this service
  const candidateSongs = songs.filter(
    (song) => !serviceSongIds.has(song.id)
  );

  // No candidates available
  if (candidateSongs.length === 0) {
    return {
      serviceId: service.id,
      requestedCount:
        service.maxSongCount ??
        service.eventType.defaultMaxSongs,
      returnedCount: 0,
      recommendations: [],
    };
  }

  // Candidate song IDs
  const songIds = candidateSongs.map((song) => song.id);

  // Performance history
  const lastPerformedMap =
    await performanceService.getLastPerformedMap(songIds);

  const performanceCountMap =
    await performanceService.getPerformanceCounts(songIds);

  // Remove songs inside the hard rotation window
  const eligibleSongs = candidateSongs.filter((song) => {
    const lastPerformed = lastPerformedMap[song.id];

    return !isInsideRotationWindow(lastPerformed);
  });

  // Still return empty array if nothing is eligible
  if (eligibleSongs.length === 0) {
    return {
      serviceId: service.id,
      requestedCount:
        service.maxSongCount ??
        service.eventType.defaultMaxSongs,
      returnedCount: 0,
      recommendations: [],
    };
  }

  // Score every eligible song
  const recommendations = eligibleSongs.map((song) => {
    const lastPerformed =
      lastPerformedMap[song.id];

    const performanceCount =
      performanceCountMap[song.id] ?? 0;

    const score = calculateScore(
      song,
      service,
      lastPerformed,
      performanceCount
    );

    return {
      id: song.id,
      title: song.title,
      composer: song.composer,
      season: song.season,
      voicing: song.voicing,
      difficulty: song.difficulty,

      score: score.total,

      scoreBreakdown: score.breakdown,

      lastPerformed,

      performanceCount,
    };
  });

  // Sort recommendations
  recommendations.sort(compareRecommendations);

  // Determine maximum songs
  const limit =
    service.maxSongCount ??
    service.eventType.defaultMaxSongs;

  // Return only required number
  const finalRecommendations =
    recommendations.slice(0, limit);

  return {
    serviceId: service.id,

    requestedCount: limit,

    returnedCount:
      finalRecommendations.length,

    recommendations: finalRecommendations,
  };
}