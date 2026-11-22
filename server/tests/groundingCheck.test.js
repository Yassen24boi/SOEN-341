const path = require('path');
const { execFileSync } = require('child_process');
const { skillsIn, findUnsupportedSkills, keepSupported, isRelevantTo, placeholderNumbers } = require('../services/groundingCheck');
const { getResumeFeedback, getTailoredFeedback } = require('../services/resumeFeedback');
const { recommendJobs } = require('../services/jobMatching');

// US-38 (Task 38.4): the checks that stop AI output from naming skills that aren't in the input.
// `fakeAI` stands in for Ollama, so these tests never need the real AI.
function fakeAI(answer) {
    return jest.fn().mockResolvedValue(JSON.stringify(answer));
}

const CV = 'Skills: JavaScript, React, MySQL, Git. Built a Node.js API with REST APIs.';

describe('Grounding check - finding skills (US-38)', () => {
    it('should find known skills without matching parts of longer words', () => {
        expect(skillsIn('JavaScript and MySQL')).toEqual(['javascript', 'mysql']);
        expect(skillsIn('Excellent communication')).toEqual([]);
        expect(skillsIn('C++ and Node.js')).toEqual(['node.js', 'c++']);
    });

    it('should flag skills that are not in the CV', () => {
        expect(findUnsupportedSkills('Strong Java and Docker background', CV)).toEqual(['java', 'docker']);
        expect(findUnsupportedSkills('Good React projects', CV)).toEqual([]);
    });

    it('should accept skills implied by the CV, like SQL for a CV that says MySQL', () => {
        expect(findUnsupportedSkills('Knows SQL', CV)).toEqual([]);
        expect(findUnsupportedSkills('Spring and Java', 'Built apps with Spring Boot')).toEqual([]);
    });

    it('should split a list into supported and unsupported items', () => {
        expect(keepSupported(['Strong React skills', 'Experienced with AWS', 'Clear layout'], CV)).toEqual({
            kept: ['Strong React skills', 'Clear layout'],
            removed: ['Experienced with AWS']
        });
    });

    it('should tell whether a skill is relevant to a job', () => {
        const job = 'Requirements: React, Node.js, SQL';

        expect(isRelevantTo('MySQL', job)).toBe(true);
        expect(isRelevantTo('Spring Boot', job)).toBe(false);
        expect(isRelevantTo('Teamwork', job)).toBe(true);
    });

    it('should replace made-up percentages but keep the ones from the CV', () => {
        expect(placeholderNumbers('Say you cut load time by 85%', 'I cut queries by 40%')).toBe('Say you cut load time by [X%]');
        expect(placeholderNumbers('Mention the 40% cut', 'I cut queries by 40%')).toBe('Mention the 40% cut');
    });
});

describe('Grounding check inside the AI features (US-38)', () => {
    it('should remove strengths that name skills the CV does not have (AT-38.1)', async () => {
        const ask = fakeAI({
            strengths: ['Solid React projects', 'Experienced with Kubernetes and AWS'],
            weaknesses: ['No summary'],
            suggestions: ['Add a summary', 'Name your tools', 'Show your results']
        });

        const feedback = await getResumeFeedback(CV, ask);

        expect(feedback.strengths).toEqual(['Solid React projects']);
        expect(feedback.flagged).toEqual(['Experienced with Kubernetes and AWS']);
    });

    it('should replace made-up numbers in suggestions with a placeholder', async () => {
        const ask = fakeAI({
            strengths: [], weaknesses: [],
            suggestions: ['Write "cut load time by 85%"', 'Add a summary', 'Name your tools']
        });

        const feedback = await getResumeFeedback(CV, ask);

        expect(feedback.suggestions[0]).toBe('Write "cut load time by [X%]"');
    });

    it('should only keep matched skills that are in the CV and asked for by the job', async () => {
        const job = { title: 'Full Stack Developer', company: 'Co', requirements: 'React, Node.js, SQL, Docker' };
        const ask = fakeAI({
            matchedSkills: ['React', 'Docker', 'Git'],
            missingSkills: ['SQL', 'Kubernetes'],
            suggestions: ['a', 'b', 'c']
        });

        const feedback = await getTailoredFeedback(CV, job, ask);

        // Docker isn't in the CV, Git isn't asked for by the job, Kubernetes isn't in the job,
        // and SQL is really matched because the CV says MySQL
        expect(feedback.matchedSkills).toEqual(['React', 'SQL']);
        expect(feedback.missingSkills).toEqual([]);
        expect(feedback.flagged).toEqual(['Docker', 'Kubernetes']);
    });

    it('should replace a job match reason that names skills the candidate does not have', async () => {
        const jobs = [{ title: 'Frontend Developer', company: 'Co', requirements: 'React' }];
        const ask = fakeAI({ matches: [{ jobNumber: 1, score: 90, reason: 'Your Angular and Vue experience fits' }] });

        const [recommendation] = await recommendJobs('Skills: React', jobs, ask);

        expect(recommendation.reason).toBe('Matches parts of your profile.');
        expect(recommendation.flagged).toEqual(['angular', 'vue']);
    });
});

// pdf.js (used by pdf-parse) can't load inside Jest's sandbox, so the PDF is read in a separate Node process
function readCvOutsideJest(file) {
    const reader = path.join(__dirname, '..', 'services', 'resumeText');
    const script = `require(${JSON.stringify(reader)}).extractTextFromFile(${JSON.stringify(file)}).then((text) => process.stdout.write(JSON.stringify(text)))`;
    return JSON.parse(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }));
}

describe('Unreadable CVs (AT-38.2)', () => {
    it('should read no text from an image-only scanned PDF, so the user sees "We couldn\'t read text from this CV"', () => {
        const text = readCvOutsideJest(path.join(__dirname, 'fixtures', 'cvs', '09-scanned-image-only.pdf'));

        expect(text).toBe('');
    });
});