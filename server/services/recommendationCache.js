// US-37 (Task 37.3): remembers each user's last job recommendations, so the AI only runs again
// when something they depend on changes. The cache lives in the server's memory, so it is
// emptied whenever the server restarts.
const cache = new Map() // userId -> { key, recommendations }

// A fingerprint of everything recommendations depend on: when the profile was last edited, the default CV,
// and the list of jobs with when each was last edited. Applying to a job removes it from the list,
// so that changes the fingerprint too (AT-37.2).
function buildCacheKey(profile, cv, jobs) {
  return JSON.stringify([
    profile?.updatedAt ? new Date(profile.updatedAt).getTime() : null,
    cv ? `${cv._id}:${cv.filename}` : null,
    jobs.map((job) => `${job._id}:${new Date(job.updatedAt).getTime()}`)
  ])
}

// Returns the saved recommendations if they were made with the same key, otherwise null
function getCachedRecommendations(userId, key) {
  const entry = cache.get(String(userId))
  return entry && entry.key === key ? entry.recommendations : null
}

function saveRecommendations(userId, key, recommendations) {
  cache.set(String(userId), { key, recommendations })
}

// Used by tests so each test starts with an empty cache
function clearRecommendationCache() {
  cache.clear()
}

module.exports = { buildCacheKey, getCachedRecommendations, saveRecommendations, clearRecommendationCache }