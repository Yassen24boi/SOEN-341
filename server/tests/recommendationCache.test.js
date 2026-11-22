const {
    buildCacheKey,
    getCachedRecommendations,
    saveRecommendations,
    clearRecommendationCache
} = require('../services/recommendationCache');

// US-37 (Task 37.3): unit tests for the recommendation cache. These don't use the database,
// so other test files adding jobs at the same time can't change the results.
const PROFILE = { updatedAt: new Date('2026-11-01T10:00:00Z') };
const CV = { _id: 'cv1', filename: 'cv1.pdf' };
const JOBS = [
    { _id: 'job1', updatedAt: new Date('2026-11-02T10:00:00Z') },
    { _id: 'job2', updatedAt: new Date('2026-11-03T10:00:00Z') }
];

describe('Recommendation cache (US-37, Task 37.3)', () => {
    beforeEach(() => {
        clearRecommendationCache();
    });

    it('should give the same key when nothing changed', () => {
        expect(buildCacheKey(PROFILE, CV, JOBS)).toBe(buildCacheKey({ ...PROFILE }, { ...CV }, [...JOBS]));
    });

    it('should give a new key when the profile is edited', () => {
        const edited = { updatedAt: new Date('2026-11-05T10:00:00Z') };

        expect(buildCacheKey(edited, CV, JOBS)).not.toBe(buildCacheKey(PROFILE, CV, JOBS));
    });

    it('should give a new key when the default CV changes', () => {
        const otherCv = { _id: 'cv2', filename: 'cv2.pdf' };

        expect(buildCacheKey(PROFILE, otherCv, JOBS)).not.toBe(buildCacheKey(PROFILE, CV, JOBS));
    });

    it('should give a new key when a job is added, removed (e.g. applied to) or edited (AT-37.2)', () => {
        const key = buildCacheKey(PROFILE, CV, JOBS);
        const added = [...JOBS, { _id: 'job3', updatedAt: new Date('2026-11-04T10:00:00Z') }];
        const removed = [JOBS[0]];
        const edited = [JOBS[0], { ...JOBS[1], updatedAt: new Date('2026-11-06T10:00:00Z') }];

        expect(buildCacheKey(PROFILE, CV, added)).not.toBe(key);
        expect(buildCacheKey(PROFILE, CV, removed)).not.toBe(key);
        expect(buildCacheKey(PROFILE, CV, edited)).not.toBe(key);
    });

    it('should return saved recommendations only for the same user and the same key', () => {
        const key = buildCacheKey(PROFILE, CV, JOBS);
        const recommendations = [{ job: { _id: 'job1' }, matchScore: 90, reason: 'Fits' }];
        saveRecommendations('user1', key, recommendations);

        expect(getCachedRecommendations('user1', key)).toEqual(recommendations);
        expect(getCachedRecommendations('user1', 'another key')).toBeNull();
        expect(getCachedRecommendations('user2', key)).toBeNull();
    });

    it('should forget everything when cleared', () => {
        saveRecommendations('user1', 'key', []);
        clearRecommendationCache();

        expect(getCachedRecommendations('user1', 'key')).toBeNull();
    });
});