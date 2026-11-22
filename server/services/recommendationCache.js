// US-37 (Task 37.3): remembers each user's last job recommendations, so the AI only runs again
// when something they depend on changes. The cache lives in the server's memory, so it is
// emptied whenever the server restarts.
const cache = new Map() // userId -> { key, recommendations }

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

module.exports = { getCachedRecommendations, saveRecommendations, clearRecommendationCache }