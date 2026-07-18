// The recommendation engine. No model file — reads other modules' data via
// their public service functions (repertoire, scheduling, performance-history).
// See PRD REC-1 through REC-4, and the "four decisions" in the Build Guide.

export async function getRecommendationsForService(serviceId) {
  // TODO: call repertoire.getAllActiveSongs()
  // TODO: call scheduling.getServiceById(serviceId) for season + min/max
  // TODO: call performance.getLastPerformedMap() to filter + score
  // TODO: apply rotation window filter, score, rank, trim to min/max
}