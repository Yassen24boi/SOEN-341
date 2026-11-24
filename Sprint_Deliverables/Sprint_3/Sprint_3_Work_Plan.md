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

**CI/CD Coordinator:** Yassen Hegazy  
**Static Analysis Coordinator:** Michel Yosufov  
**Test Contributors:** All Team Members

The CI/CD pipeline and automated test integration were implemented during Sprint 3. Sprint 4 will build upon the existing infrastructure rather than recreate it.

Each team member is individually responsible for implementing, maintaining, and executing automated tests for their assigned user stories.

### Individual Testing Responsibilities

- Implement unit tests for every assigned feature.
- Implement relevant integration and acceptance tests.
- Cover expected behaviour, edge cases, and failure scenarios.
- Ensure newly implemented tests run automatically through the existing CI/CD pipeline.
- Resolve failing tests associated with assigned functionality.
- Include tests within the corresponding feature pull request.
- Ensure all required CI checks pass before merging.

### CI/CD Coordinator Responsibilities

- Maintain the existing CI/CD infrastructure.
- Verify that newly implemented tests execute automatically.
- Monitor pipeline execution and resolve infrastructure-related issues.
- Identify gaps in application test coverage.
- Coordinate final CI/CD verification.

### Static Analysis Responsibilities

- Integrate static analysis into the existing CI/CD pipeline.
- Document identified bugs, vulnerabilities, and code smells.
- Ensure developers resolve issues associated with their respective code.

Testing is a shared development responsibility and is not assigned exclusively to the CI/CD coordinator.
