# Sprint 4 Work Plan — CareerConnect

## 1. Sprint Overview

Sprint 4 focuses on completing CareerConnect's remaining functionality, finalizing Generative AI features, improving software quality, and preparing the application for its final evaluation.

Building on Sprints 1, 2, and 3, the team will complete AI-powered resume feedback and job matching, finalize recruiter and job seeker functionality, reorganize the repository, and strengthen automated testing and software maintenance practices.

Development responsibilities will be distributed among all five team members to ensure balanced individual contributions.

## 2. Sprint Goal

The primary goal of Sprint 4 is to deliver a complete, stable, and fully tested CareerConnect platform.

The team aims to:

- Complete both Generative AI features.
- Validate AI-generated responses and recommendations.
- Ensure user privacy and appropriate AI failure handling.
- Complete remaining recruiter and job seeker functionality.
- Implement acceptance tests for all Sprint 4 user stories.
- Ensure automated unit tests for all application code run through CI.
- Reorganize the repository structure.
- Integrate static analysis into the CI pipeline.
- Enforce consistent coding standards.
- Conduct code reviews for every Sprint 4 pull request.
- Maintain GitHub Issues, project documentation, and contribution logs.
- Prepare the application for the final demonstration.

## 3. Team Roles & Responsibilities

| **Team Member** | **Role** | **Primary Responsibilities** |
|---|---|---|
| Yassen Hegazy | Scrum Master / Full-Stack Developer | Unit testing, CI integration, code review coordination, sprint planning and documentation |
| Julia Kyrychuk | Frontend Developer / QA Tester | Recruiter profile, saved jobs, integration and regression testing |
| Noor Rabie | Full-Stack Developer / Issue Manager | Generative AI integration, validation and GitHub issue management |
| Jose David Torres | Full-Stack Developer / Database Developer | AI resume feedback, job matching, privacy and failure handling |
| Michel Yosufov | Backend Developer | Repository organization, static analysis, software maintenance and coding standards |

## 4. Sprint 4 Backlog — User Stories

The following user stories correspond to the remaining open issues in the CareerConnect GitHub repository.

### Feature 1 — Generative AI Integration

**Target Completion:** November 29, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #92 | US-33: AI-Powered Resume Feedback | Jose David Torres | High | Open |
| #93 | US-34: AI Job Matching Suggestions | Jose David Torres | High | Open |
| #128 | US-36: Tailor AI Resume Feedback to a Job Posting | Noor Rabie | High | Open |
| #129 | US-37: Show AI Job Recommendations | Noor Rabie | High | Open |
| #130 | US-38: Validate and Document Both AI Features | Noor Rabie | High | Open |
| #131 | US-39: Protect Privacy and Handle AI Failures | Jose David Torres | High | Open |

**Expected Deliverable:**

Job seekers can receive personalized AI-powered resume feedback and job recommendations based on their qualifications and relevant job postings.

Both AI features will be fully integrated, tested, and documented. Validation will address output relevance, technical limitations, privacy considerations, and failure handling.

### Feature 2 — Remaining Application Functionality

**Target Completion:** November 28, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #90 | US-31: Remind Users of Upcoming Deadlines | Noor Rabie | Medium | Open |
| #132 | US-41: Recruiter Professional Profile | Julia Kyrychuk | High | Open |
| #139 | US-48: Save Jobs to Favourites (Optional) | Julia Kyrychuk | Low | Open |

**Expected Deliverable:**

Users can receive reminders for upcoming deadlines, recruiters can manage their professional profiles, and job seekers can save relevant job postings to their favourites.

### Feature 3 — Repository Organization & Software Maintenance

**Target Completion:** November 29, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #134 | US-43: Reorganize the Repository Structure | Michel Yosufov | High | Open |
| #135 | US-44: Static Analysis in CI and Issue Fixing | Michel Yosufov | High | Open |
| #137 | US-46: Enforce Coding Standards | Michel Yosufov | High | Open |

**Expected Deliverable:**

The CareerConnect repository will follow a consistent and maintainable structure. Static analysis will be integrated into the CI pipeline to identify bugs, vulnerabilities, and code smells.

Identified issues will be documented and resolved where applicable. Consistent coding standards will be established and followed throughout the application.

### Feature 4 — Quality Assurance, Code Reviews & Unit Testing

**Target Completion:** November 30, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #133 | US-42: End-to-End Integration and Final Regression | Julia Kyrychuk | High | Open |
| #136 | US-45: Code Review on Every Sprint 4 Pull Request | Yassen Hegazy | High | Open |
| #138 | US-47: Unit Tests for All Code in CI/CD | Yassen Hegazy | High | Open |

**Expected Deliverable:**

All application features will be integrated and tested. Every Sprint 4 pull request will be reviewed by at least one other team member before merging.

Automated unit tests will be executed through the CI pipeline. Yassen will coordinate testing and CI integration, while each developer remains responsible for implementing tests for their assigned features.

### User Story Distribution Summary

| **Team Member** | **User Stories** | **Total** |
|---|---|---|
| Yassen Hegazy | US-45, US-47 | 2 |
| Julia Kyrychuk | US-41, US-42, US-48 | 3 |
| Noor Rabie | US-31, US-36, US-37, US-38 | 4 |
| Jose David Torres | US-33, US-34, US-39 | 3 |
| Michel Yosufov | US-43, US-44, US-46 | 3 |
| **Total** | | **15** |

The workload distribution considers the complexity and scope of each user story rather than solely the number of assigned issues. Project-wide testing, code review coordination, and Scrum Master responsibilities compensate for Yassen's lower number of assigned user stories.

## 5. Sprint 1, Sprint 2 & Sprint 3 Features — Review & Testing

The following previously implemented features will be reviewed and tested during Sprint 4.

| **Feature** | **Responsible Member** |
|---|---|
| User Registration and Authentication | Michel Yosufov |
| User Profile and Resume Management | Yassen Hegazy / Julia Kyrychuk |
| Job Search and Filtering | Noor Rabie |
| Job Application Submission and Tracking | Jose David Torres |
| Recruiter Dashboard and Posting Management | Michel Yosufov |
| Candidate Review and Application Status Management | Jose David Torres |
| Application History and Analytics Dashboard | Julia Kyrychuk |
| Notifications and Recruiter Alerts | Yassen Hegazy |
| Interview Invitations | Noor Rabie |
| Existing CI Pipeline and Automated Tests | Yassen Hegazy / Julia Kyrychuk |

The team will verify existing functionality, resolve outstanding issues, and ensure compatibility with newly implemented features.

## 6. Sprint 4 Development & Management Tasks

The following tasks will be tracked through GitHub Issues and linked to their corresponding user stories.

| **Task Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|
| Sprint 4 Planning and Coordination | Yassen | High | Not Started |
| GitHub Project Board Management | Yassen | High | Not Started |
| Coordinate Sprint 4 Pull Request Reviews | Yassen | High | Not Started |
| Coordinate Unit Testing and CI Integration | Yassen | High | Not Started |
| Verify Automated Test Execution | Yassen | High | Not Started |
| Implement Recruiter Professional Profile | Julia | High | Not Started |
| Execute End-to-End Integration Testing | Julia | High | Not Started |
| Execute Final Regression Testing | Julia | High | Not Started |
| Implement Saved Job Functionality | Julia | Low | Not Started |
| Complete Deadline Reminders | Noor | Medium | Not Started |
| Tailor AI Resume Feedback to Job Postings | Noor | High | Not Started |
| Implement AI Job Recommendation Interface | Noor | High | Not Started |
| Validate and Document AI Features | Noor | High | Not Started |
| Organize GitHub Issues and Tasks | Noor | High | Not Started |
| Complete AI-Powered Resume Feedback | Jose David | High | Not Started |
| Complete AI Job Matching Suggestions | Jose David | High | Not Started |
| Implement AI Privacy Protection | Jose David | High | Not Started |
| Implement AI Failure Handling | Jose David | High | Not Started |
| Reorganize Repository Structure | Michel | High | Not Started |
| Integrate Static Analysis into CI | Michel | High | Not Started |
| Resolve Static Analysis Issues | Michel | High | Not Started |
| Establish and Enforce Coding Standards | Michel | High | Not Started |
| Prepare Acceptance Tests | All Members | High | Not Started |
| Implement Unit Tests for Assigned Features | All Members | High | Not Started |
| Review Sprint 4 Pull Requests | All Members | High | Not Started |
| Execute Integration Tests and Report Bugs | All Members | High | Not Started |
| Maintain AI Usage and Contribution Logs | All Members | High | Not Started |
| Prepare Sprint 4 Summary Report | Yassen / All Members | High | Not Started |
| Prepare Final Application Demonstration | All Members | High | Not Started |

## 7. Acceptance Testing

**Testing Coordinator:** Julia Kyrychuk  
**GitHub Issue Management:** Noor Rabie  
**Test Contributors:** All Team Members

At least one acceptance test must be created for each Sprint 4 user story.

With 15 user stories, the team will prepare at least 15 acceptance tests or corresponding verification checks, including tests for AI functionality, privacy protection, and software quality requirements.

**Planned Activities**

- Create and organize acceptance tests.
- Link tests to corresponding GitHub Issues.
- Define expected outcomes.
- Validate AI-generated feedback and recommendations.
- Test invalid inputs and AI service failures.
- Execute tests against implemented functionality.
- Record test results.
- Report identified bugs.
- Verify corrected functionality.

**Proposed Target Dates**

- November 24–26: Create and organize acceptance tests.
- November 27–29: Execute tests and report issues.
- November 30: Complete testing and verify fixes.

## 8. Continuous Integration & Unit Testing

**Responsible:** Yassen Hegazy  
**Static Analysis:** Michel Yosufov  
**Test Contributors:** All Team Members

**Target Completion:** November 30, 2026 (proposed)

**Planned Tasks**

- Maintain the existing GitHub Actions CI pipeline.
- Review automated tests from previous sprints.
- Implement automated unit tests for Sprint 4 features.
- Address gaps in existing application test coverage.
- Integrate static analysis into the CI workflow.
- Verify tests run automatically when pull requests are created.
- Resolve pipeline configuration errors.
- Document successful CI execution.
- Document static analysis results and associated fixes.
- Ensure all developers contribute unit tests for their features.

## 9. Scrum Master Responsibilities

**Responsible:** Yassen Hegazy

**Sprint Planning**

- Facilitate Sprint 4 planning.
- Coordinate task assignments.
- Establish priorities and deadlines.
- Ensure user stories are broken into development tasks.
- Ensure individual workloads remain balanced.

**Sprint Monitoring**

- Maintain the GitHub Project Board.
- Track task progress.
- Identify blockers.
- Coordinate communication between team members.
- Ensure GitHub Issues remain updated.
- Monitor CI pipeline execution.
- Coordinate pull request reviews.

**Sprint Delivery**

- Monitor completion of required deliverables.
- Coordinate sprint documentation.
- Verify completion of software quality requirements.
- Ensure contribution logs and AI usage logs are maintained.
- Organize the final application demonstration.
- Prepare the Sprint 4 Summary Report.

## 10. Sprint Schedule

The following dates are proposed and should be adjusted to the confirmed evaluation deadline.

| **Date** | **Planned Activities** | **Responsible Members** |
|---|---|---|
| Nov 24 | Finalize sprint plan and distribute responsibilities | Yassen / All Members |
| Nov 25 | Create development tasks, organize GitHub Issues and define acceptance tests | Noor / All Members |
| Nov 26 | Continue AI development, remaining application features and repository organization | All Developers |
| Nov 27 | Integrate AI features, implement privacy protection and configure static analysis | Noor / Jose David / Michel |
| Nov 28 | Complete remaining application functionality and begin integration testing | Julia / Noor |
| Nov 29 | Complete AI functionality, validation, static analysis and coding standards | Noor / Jose David / Michel |
| Nov 30 | Execute acceptance tests, unit tests, regression tests and CI verification | All Members |
| Dec 1 | Final code reviews, integration testing and bug fixes | All Members |
| Before Evaluation | Prepare final demonstration, summary report and individual documentation | All Members |

## 11. Shared Team Responsibilities

All team members are responsible for:

- Updating assigned GitHub Issues.
- Maintaining individual contribution logs.
- Recording time spent on activities.
- Providing links to commits, pull requests, and issues.
- Maintaining individual AI usage logs.
- Participating in sprint meetings.
- Reviewing pull requests when assigned.
- Following established coding standards.
- Implementing unit tests for assigned functionality.
- Testing previously implemented features.
- Resolving identified bugs and static analysis issues.
- Communicating blockers and delays.

## 12. Definition of Done

A task is considered complete when:

- Required functionality has been implemented.
- Relevant acceptance tests have passed.
- Unit tests have passed.
- Code complies with established coding standards.
- Code has been reviewed and approved by at least one other team member.
- Identified static analysis issues have been addressed where applicable.
- Changes have been merged into the appropriate branch.
- Required CI checks pass.
- GitHub Issue status has been updated.
- Contribution logs and AI usage logs have been updated where applicable.
- Relevant technical documentation has been completed.

## 13. Expected Sprint 4 Deliverables

- Completed AI-Powered Resume Feedback Feature.
- Completed AI Job Matching Feature.
- AI Feature Validation and Technical Documentation.
- Completed Remaining Mandatory Application Functionality.
- Acceptance Tests for Sprint 4 User Stories.
- Automated Unit Tests for Application Code.
- Functional Continuous Integration Pipeline.
- Reorganized Repository Structure.
- Static Analysis Integration and Maintenance Documentation.
- Documented Coding Standards.
- Sprint 4 Pull Request Review Records.
- Updated GitHub Project Board and Sprint Backlog.
- Individual Contribution Logs.
- Updated AI Usage Logs.
- Individual Sprint 4 PDF Reports.
- Sprint 4 Summary Report.
- Updated Meeting Minutes.
- Final Demonstration of the CareerConnect Platform.

## 14. Sprint Completion Criteria

Sprint 4 will be considered ready for evaluation when:

- All mandatory core features have been implemented.
- At least two Generative AI features have been completed, integrated, and validated.
- AI privacy considerations, limitations, and failure handling have been documented.
- Acceptance tests have been created and linked to user stories.
- Unit tests have been implemented and run automatically through CI.
- Static analysis has been integrated into the CI pipeline.
- Identified software quality issues have been documented and addressed.
- All Sprint 4 pull requests have been reviewed.
- The repository follows a consistent and maintainable structure.
- Previous sprint functionality has been reviewed and integrated.
- All required documentation has been updated.
- Individual contributions have been recorded.
- The team has prepared the final demonstration.
- The GitHub repository reflects the final project state.
