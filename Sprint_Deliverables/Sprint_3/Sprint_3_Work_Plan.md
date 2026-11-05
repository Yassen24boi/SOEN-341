# Sprint 3 Work Plan — CareerConnect

## 1. Sprint Overview

Sprint 3 focuses on completing CareerConnect's remaining core functionality, integrating previously developed components, and improving software quality through automated testing.

Building on Sprints 1 and 2, the team will prioritize the completion of the recruiter dashboard, application analytics, and notification system while beginning development of the Generative AI features.

Development responsibilities will be distributed among team members to ensure individual technical contributions and effective collaboration.

## 2. Sprint Goal

The primary goal of Sprint 3 is to deliver a more complete, integrated, and reliable CareerConnect platform.

The team aims to:

- Complete recruiter dashboard and job posting management.
- Implement application history and analytics functionality.
- Develop in-app notifications and reminders.
- Begin implementing AI-powered resume feedback and job matching suggestions.
- Create acceptance tests for all Sprint 3 user stories.
- Implement automated unit tests for Sprint 3 features.
- Maintain and verify the Continuous Integration (CI) pipeline.
- Review and refine functionality developed during previous sprints.
- Maintain organized GitHub Issues, tasks, and project documentation.
- Ensure all team members contribute to development and testing.

## 3. Team Roles & Responsibilities

| Team Member | Role | Primary Responsibilities |
|---|---|---|
| Yassen Hegazy | Scrum Master / Backend Developer | Sprint coordination, GitHub management, notification system integration, documentation |
| Julia Kyrychuk | Frontend Developer / QA Tester | Application analytics interface, acceptance testing, unit testing, CI verification |
| Noor Rabie | Full-Stack Developer / Issue Manager | AI functionality, GitHub issue management, user stories, task breakdown |
| Jose David Torres | Full-Stack Developer / Database Developer | Application analytics backend, MongoDB integration, application history |
| Michel Yosufov | Backend Developer | Recruiter dashboard, posting management, candidate review and application status updates |

All members are responsible for testing their implemented features and contributing to integration and documentation.

## 4. Sprint 3 Backlog — User Stories

The following user stories have been created in the CareerConnect GitHub repository.

### Feature 1 — Recruiter Dashboard & Posting Management

**Target Completion:** November 11, 2026 (proposed)

| Issue # | Issue Title | Responsible Member | Priority | Status |
|---|---|---|---|---|
| Sprint 3 issue | US-20: Complete Recruiter Posting Management | Michel Yosufov | High | Not Started |
| #80 | US-21: Archive and Restore Job Postings | Michel Yosufov | High | Not Started |
| #81 | US-22: Filter and Sort Applications for a Posting | Michel Yosufov | High | Not Started |
| #82 | US-23: Review a Candidate | Michel Yosufov | High | Not Started |
| #83 | US-24: Update a Candidate's Application Status | Michel Yosufov | High | Not Started |

**Expected Deliverable:**

Recruiters can manage their job postings, archive and restore postings, filter applications, review candidates, and update application statuses through the recruiter dashboard.

Previously developed recruiter functionality will be refined and fully integrated.

### Feature 2 — Application Analytics & History Dashboard

**Target Completion:** November 11, 2026 (proposed)

| Issue # | Issue Title | Responsible Member | Priority | Status |
|---|---|---|---|---|
| #84 | US-25: See My Full Application History | Julia Kyrychuk / Jose David Torres | High | Not Started |
| #85 | US-26: See a Breakdown of My Application Statuses | Julia Kyrychuk / Jose David Torres | High | Not Started |
| #86 | US-27: See My Job-Search Activity Over Time | Julia Kyrychuk / Jose David Torres | Medium | Not Started |

**Expected Deliverable:**

Job seekers can view their complete application history, visualize application status distributions, and monitor their job-search activity over time.

Julia will focus on the frontend interface and visualizations, while Jose David will support database queries, APIs, and application data integration.

### Feature 3 — Notifications & Reminders

**Target Completion:** November 12, 2026 (proposed)

| Issue # | Issue Title | Responsible Member | Priority | Status |
|---|---|---|---|---|
| #87 | US-28: In-App Notification Centre | Yassen Hegazy | High | Not Started |
| #88 | US-29: Notify Job Seekers of Application Updates | Yassen Hegazy | High | Not Started |
| #89 | US-30: Send Interview Invitations | Yassen Hegazy | High | Not Started |
| #90 | US-31: Remind Users of Upcoming Deadlines | Yassen Hegazy | Medium | Not Started |
| #91 | US-32: Notify Recruiters of New Applications | Yassen Hegazy | Medium | Not Started |

**Expected Deliverable:**

Users receive relevant in-app notifications for application updates, interview invitations, approaching deadlines, and new applications.

The notification centre will integrate with existing user accounts, job applications, and recruiter workflows.

### Feature 4 — Generative AI Integration

**Target:** Begin Development During Sprint 3

| Issue # | Issue Title | Responsible Member | Priority | Status |
|---|---|---|---|---|
| #92 | US-33: AI-Powered Resume Feedback | Noor Rabie | High | Not Started |
| #93 | US-34: AI Job Matching Suggestions | Noor Rabie | Medium | Not Started |

**Expected Deliverable:**

Initial Generative AI functionality that supports resume analysis or job matching recommendations.

Planned activities include:

- Research appropriate AI integration approaches.
- Define the inputs and expected outputs.
- Begin implementing backend integration.
- Develop an initial prototype.
- Test the initial functionality.
- Document AI-assisted development decisions and limitations.

The official requirement is to begin at least one approved AI feature during Sprint 3 and complete it during Sprint 4. Both stories are included in the backlog, but full completion of both is not required for Sprint 3.

### Feature 5 — Quality Assurance & Unit Testing

**Target Completion:** November 13, 2026 (proposed)

| Issue # | Issue Title | Responsible Member | Priority | Status |
|---|---|---|---|---|
| #94 | US-35: Unit Tests for All Sprint 3 Features Run in CI | Julia Kyrychuk / All Members | High | Not Started |

**Expected Deliverable:**

A functional automated testing workflow that executes unit tests for all Sprint 3 features through the CI pipeline.

Each developer will write tests for their implemented functionality. Julia will coordinate test integration and CI verification.

## 5. Sprint 1 & Sprint 2 Features — Review & Testing

The following previously implemented features will be reviewed and tested during Sprint 3:

| Feature | Responsible Member |
|---|---|
| User Registration and Authentication | Michel Yosufov |
| User Profile and Resume Management | Yassen Hegazy / Julia Kyrychuk |
| Job Search and Filtering | Noor Rabie |
| Job Application Submission and Tracking | Jose David Torres |
| Initial Recruiter Dashboard | Michel Yosufov |
| Existing Automated Tests and CI Pipeline | Julia Kyrychuk |

The team will verify existing functionality, address outstanding issues, and ensure compatibility with newly implemented features.

## 6. Sprint 3 Development & Management Tasks

The following tasks will be tracked through GitHub Issues and linked to their corresponding user stories.

| Task Title | Responsible Member | Priority | Status |
|---|---|---|---|
| Sprint 3 Planning and Coordination | Yassen | High | Not Started |
| GitHub Project Board Management | Yassen | High | Not Started |
| Complete Recruiter Dashboard | Michel | High | Not Started |
| Implement Posting Archive and Restore | Michel | High | Not Started |
| Implement Application Filtering | Michel | High | Not Started |
| Implement Candidate Review and Status Updates | Michel | High | Not Started |
| Implement Application History Interface | Julia | High | Not Started |
| Implement Application Analytics Visualizations | Julia | High | Not Started |
| Develop Application Analytics APIs | Jose David | High | Not Started |
| Integrate Application Data with MongoDB | Jose David | High | Not Started |
| Implement Notification Centre | Yassen | High | Not Started |
| Implement Application Update Notifications | Yassen | High | Not Started |
| Implement Interview Invitations and Reminders | Yassen | High | Not Started |
| Implement Recruiter Notifications | Yassen | Medium | Not Started |
| Begin AI Resume Feedback Development | Noor | High | Not Started |
| Begin AI Job Matching Development | Noor | Medium | Not Started |
| Organize GitHub Issues and User Stories | Noor | High | Not Started |
| Prepare Acceptance Tests | All Members | High | Not Started |
| Implement Sprint 3 Unit Tests | All Members | High | Not Started |
| Verify Automated Tests in CI | Julia | High | Not Started |
| Execute Integration Tests and Report Bugs | All Members | High | Not Started |
| Maintain AI Usage and Contribution Logs | All Members | High | Not Started |
| Prepare Sprint 3 Summary Report | Yassen / All Members | Medium | Not Started |
| Prepare Sprint 3 Demonstration | All Members | High | Not Started |

## 7. Acceptance Testing

**Testing Coordinator:** Julia Kyrychuk  
**GitHub Issue Management:** Noor Rabie  
**Test Contributors:** All Team Members

At least one acceptance test must be created for each Sprint 3 user story.

**Planned Activities**

- Define acceptance criteria for each user story.
- Create and organize acceptance tests.
- Link acceptance tests to corresponding GitHub Issues.
- Specify expected outcomes.
- Execute tests against implemented functionality.
- Record results and report identified bugs.
- Verify fixes and retest affected features.
- Document testing evidence for evaluation.

**Proposed Target Dates**

- November 5–7: Define and organize acceptance tests.
- November 8–12: Execute acceptance tests during development.
- November 13: Final testing and verification.

## 8. Continuous Integration & Unit Testing

**Testing Coordinator:** Julia Kyrychuk  
**Unit Test Contributors:** All Developers

**Target Completion:** November 13, 2026 (proposed)

**Planned Tasks**

- Maintain the existing GitHub Actions CI pipeline.
- Implement unit tests for all Sprint 3 features.
- Test frontend components and backend logic.
- Verify API functionality and database operations.
- Configure unit tests to execute automatically through CI.
- Verify CI execution on pull requests.
- Resolve failing tests and pipeline errors.
- Document successful automated test execution.

Each team member will be responsible for the unit tests associated with their assigned features.

## 9. Scrum Master Responsibilities

**Responsible:** Yassen Hegazy

**Sprint Planning**

- Facilitate Sprint 3 planning.
- Coordinate task assignments.
- Establish priorities and proposed deadlines.
- Ensure user stories are broken into development tasks.

**Sprint Monitoring**

- Maintain the GitHub Project Board.
- Track task progress and completion.
- Identify and communicate blockers.
- Coordinate communication between team members.
- Monitor pull requests and feature integration.
- Ensure GitHub Issues remain updated.

**Sprint Delivery**

- Monitor completion of required deliverables.
- Coordinate sprint documentation.
- Ensure contribution logs and AI usage logs are maintained.
- Organize the final Sprint 3 demonstration.
- Coordinate preparation of the Sprint 3 Summary Report.
- Verify that required artifacts are available in the repository.

## 10. Sprint Schedule

The following schedule is proposed and will be adjusted to the confirmed laboratory evaluation date.

| Date | Planned Activities | Responsible Members |
|---|---|---|
| Nov 5 | Finalize Sprint 3 plan and distribute responsibilities | Yassen / All Members |
| Nov 6 | Organize GitHub Issues, create tasks, define acceptance tests | Noor / Julia / All Members |
| Nov 7 | Begin recruiter dashboard, analytics, notifications, and AI development | All Developers |
| Nov 8 | Continue core feature implementation and backend integration | All Developers |
| Nov 9 | Develop analytics APIs, notification logic, and recruiter features | Jose / Yassen / Michel / Julia |
| Nov 10 | Integrate frontend and backend components | All Developers |
| Nov 11 | Complete recruiter dashboard and application analytics | Michel / Julia / Jose |
| Nov 12 | Complete notifications and initial AI development milestone | Yassen / Noor |
| Nov 13 | Execute unit tests, acceptance tests, CI checks, and bug fixes | Julia / All Members |
| Nov 14 | Final integration, documentation, and demonstration preparation | All Members |
| Before evaluation | Verify repository, reports, logs, and demonstration | All Members |

## 11. Shared Team Responsibilities

All team members are responsible for:

- Updating assigned GitHub Issues.
- Maintaining individual contribution logs.
- Recording time spent on development activities.
- Providing links to commits, pull requests, and issues.
- Maintaining individual AI usage logs.
- Participating in sprint meetings.
- Reviewing pull requests when assigned.
- Writing and executing tests for their implemented features.
- Communicating blockers and delays.
- Supporting integration and debugging.
- Preparing to explain their contributions during evaluation.

## 12. Definition of Done

A Sprint 3 task is considered complete when:

- Required functionality has been implemented.
- Acceptance criteria have been satisfied.
- Relevant unit tests have passed.
- Code has been reviewed and approved.
- Changes have been merged into the appropriate branch.
- Required CI checks pass.
- GitHub Issue status has been updated.
- Contribution logs and AI usage logs have been updated where applicable.

## 13. Expected Sprint 3 Deliverables

- Completed Recruiter Dashboard and Posting Management.
- Completed Application Analytics and History Dashboard.
- Completed Notifications and Reminders.
- Initial implementation of at least one approved Generative AI feature.
- Acceptance tests for all Sprint 3 user stories.
- Automated unit tests for all Sprint 3 features.
- Functional Continuous Integration Pipeline.
- Updated GitHub Project Board and Sprint Backlog.
- Updated Meeting Minutes.
- Detailed Individual Contribution Logs.
- Updated AI Usage Logs.
- Individual Sprint 3 PDF reports in personal AI_Log directories.
- One-Page Sprint 3 Summary Report.
- Demonstration of Implemented Features.

## 14. Sprint Completion Criteria

Sprint 3 will be considered ready for evaluation when:

- All required core features have been implemented and integrated.
- At least one approved Generative AI feature has begun development.
- Acceptance tests have been created and executed.
- Unit tests for Sprint 3 features run automatically through CI.
- Existing functionality has been reviewed and verified.
- Required documentation has been updated.
- Individual contributions have been recorded.
- The team has prepared a demonstration.
- The GitHub repository reflects the current project state and contains all required artifacts.
