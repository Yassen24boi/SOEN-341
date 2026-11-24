
# Sprint 4 Work Plan — CareerConnect

## 1. Sprint Overview

Sprint 4 focuses on completing CareerConnect's remaining functionality, finalizing Generative AI features, improving software quality, and preparing the application for its final evaluation.

Building on Sprints 1, 2, and 3, the team will complete AI-powered resume feedback and job matching, finalize remaining recruiter and job seeker functionality, reorganize the repository, and improve software maintenance practices.

The existing CI/CD pipeline and automated testing infrastructure implemented during Sprint 3 will be maintained and extended to support Sprint 4 functionality.

Development and testing responsibilities will be distributed among all five team members to ensure balanced individual contributions.

## 2. Sprint Goal

The primary goal of Sprint 4 is to deliver a complete, stable, and fully tested CareerConnect platform.

The team aims to:

- Complete both Generative AI features.
- Validate AI-generated responses and recommendations.
- Ensure user privacy and appropriate AI failure handling.
- Complete remaining recruiter and job seeker functionality.
- Create acceptance tests for all Sprint 4 user stories.
- Ensure each developer implements automated tests for their assigned features.
- Maintain the existing CI/CD pipeline.
- Ensure newly implemented tests execute automatically through CI/CD.
- Reorganize the repository structure.
- Integrate static analysis into the CI pipeline.
- Enforce consistent coding standards.
- Conduct code reviews for every Sprint 4 pull request.
- Review and refine previously implemented functionality.
- Maintain GitHub Issues, project documentation, and contribution logs.
- Prepare the application for the final demonstration.

## 3. Team Roles & Responsibilities

| **Team Member** | **Role** | **Primary Responsibilities** |
|---|---|---|
| Yassen Hegazy | Scrum Master / Full-Stack Developer | Saved jobs functionality, CI/CD maintenance, code review coordination, sprint planning and documentation |
| Julia Kyrychuk | Frontend Developer / QA Tester | Recruiter professional profile, end-to-end integration and regression testing |
| Noor Rabie | Full-Stack Developer / Issue Manager | Deadline reminders, Generative AI integration, AI validation and GitHub issue management |
| Jose David Torres | Full-Stack Developer / Database Developer | AI resume feedback, job matching, privacy protection and failure handling |
| Michel Yosufov | Backend Developer | Repository organization, static analysis, software maintenance and coding standards |

All team members are individually responsible for implementing automated tests, acceptance tests, and relevant integration tests for their assigned features.

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

Both AI features will be fully integrated, tested, and documented.

AI documentation will address:

- Feature purpose and functionality.
- Input data and expected outputs.
- Prompts and model configurations.
- Output relevance and accuracy.
- Representative inputs and edge cases.
- Technical limitations.
- Privacy considerations.
- Error and failure handling.

The responsible developers will implement automated tests for their respective AI features and ensure that these tests execute through the existing CI/CD pipeline.

### Feature 2 — Remaining Application Functionality

**Target Completion:** November 28, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #90 | US-31: Remind Users of Upcoming Deadlines | Noor Rabie | Medium | Open |
| #132 | US-41: Recruiter Professional Profile | Julia Kyrychuk | High | Open |
| #139 | US-48: Save Jobs to Favourites (Optional) | Yassen Hegazy | Low | Open |

**Expected Deliverable:**

Users can receive reminders for upcoming deadlines, recruiters can manage their professional profiles, and job seekers can save relevant job postings to their favourites.

Each feature will include relevant automated tests and acceptance tests implemented by its responsible developer.

The optional saved jobs feature will be completed provided that mandatory Sprint 4 requirements remain on schedule.

### Feature 3 — Repository Organization & Software Maintenance

**Target Completion:** November 29, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #134 | US-43: Reorganize the Repository Structure | Michel Yosufov | High | Open |
| #135 | US-44: Static Analysis in CI and Issue Fixing | Michel Yosufov | High | Open |
| #137 | US-46: Enforce Coding Standards | Michel Yosufov | High | Open |

**Expected Deliverable:**

The CareerConnect repository will follow a consistent, organized, and maintainable structure.

Static analysis will be integrated into the existing CI/CD pipeline to identify bugs, vulnerabilities, and code smells.

Identified issues will be documented and linked to corresponding GitHub Issues and corrective commits.

Michel will coordinate static analysis and software maintenance activities. However, each developer remains responsible for resolving identified issues associated with their respective code.

Consistent coding standards will be established and followed by all team members.

### Feature 4 — Quality Assurance, Code Reviews & Unit Testing

**Target Completion:** November 30, 2026 (proposed)

| **Issue #** | **Issue Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|---|
| #133 | US-42: End-to-End Integration and Final Regression | Julia Kyrychuk | High | Open |
| #136 | US-45: Code Review on Every Sprint 4 Pull Request | Yassen Hegazy | High | Open |
| #138 | US-47: Unit Tests for All Code in CI/CD | Yassen Hegazy / All Members | High | Open |

**Expected Deliverable:**

All application features will be integrated and tested.

Every Sprint 4 pull request will be reviewed by at least one other team member before merging.

The existing CI/CD pipeline and automated testing infrastructure, implemented by Yassen during Sprint 3, will be maintained and extended to support newly developed features.

Each developer is responsible for implementing automated tests for their own assigned features.

Yassen will coordinate CI/CD verification and code review activities but will not be solely responsible for implementing tests for features developed by other team members.

### User Story Distribution Summary

| **Team Member** | **User Stories** | **Total** |
|---|---|---|
| Yassen Hegazy | US-45, US-47, US-48 | 3 |
| Julia Kyrychuk | US-41, US-42 | 2 |
| Noor Rabie | US-31, US-36, US-37, US-38 | 4 |
| Jose David Torres | US-33, US-34, US-39 | 3 |
| Michel Yosufov | US-43, US-44, US-46 | 3 |
| **Total** | | **15** |

The workload distribution considers the complexity and scope of each user story rather than solely the number of assigned issues.

Julia's end-to-end integration and regression testing responsibilities cover the entire application. Similarly, Yassen's CI/CD maintenance, code review coordination, and Scrum Master responsibilities extend across all Sprint 4 activities.

Noor retains her four existing assignments.

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
| Existing CI/CD Pipeline and Automated Test Infrastructure | Yassen Hegazy |
| Final Application Integration and Regression Testing | Julia Kyrychuk / All Members |

The team will verify existing functionality, resolve outstanding issues, and ensure compatibility with newly implemented features.

Each developer is responsible for reviewing and maintaining the automated tests associated with their previously implemented functionality.

## 6. Sprint 4 Development & Management Tasks

The following tasks will be tracked through GitHub Issues and linked to their corresponding user stories.

| **Task Title** | **Responsible Member** | **Priority** | **Status** |
|---|---|---|---|
| Sprint 4 Planning and Coordination | Yassen | High | Not Started |
| GitHub Project Board Management | Yassen | High | Not Started |
| Existing CI/CD Pipeline Implementation | Yassen | High | Completed |
| Existing Automated Test Integration | Yassen | High | Completed |
| Maintain and Verify Existing CI/CD Pipeline | Yassen | High | Not Started |
| Coordinate Sprint 4 Pull Request Reviews | Yassen | High | Not Started |
| Implement Saved Job Functionality | Yassen | Low | Not Started |
| Implement Automated Tests for Saved Jobs | Yassen | Medium | Not Started |
| Implement Recruiter Professional Profile | Julia | High | Not Started |
| Implement Automated Tests for Recruiter Profile | Julia | High | Not Started |
| Coordinate End-to-End Integration Testing | Julia | High | Not Started |
| Coordinate Final Regression Testing | Julia | High | Not Started |
| Complete Deadline Reminders | Noor | Medium | Not Started |
| Tailor AI Resume Feedback to Job Postings | Noor | High | Not Started |
| Implement AI Job Recommendation Interface | Noor | High | Not Started |
| Validate and Document Both AI Features | Noor | High | Not Started |
| Implement Automated Tests for Assigned Features | Noor | High | Not Started |
| Organize GitHub Issues and Tasks | Noor | High | Not Started |
| Complete AI-Powered Resume Feedback | Jose David | High | Not Started |
| Complete AI Job Matching Suggestions | Jose David | High | Not Started |
| Implement AI Privacy Protection | Jose David | High | Not Started |
| Implement AI Failure Handling | Jose David | High | Not Started |
| Implement Automated Tests for Assigned Features | Jose David | High | Not Started |
| Reorganize Repository Structure | Michel | High | Not Started |
| Integrate Static Analysis into CI | Michel | High | Not Started |
| Document Static Analysis Findings | Michel | High | Not Started |
| Establish and Enforce Coding Standards | Michel | High | Not Started |
| Verify Tests Following Repository Refactoring | Michel | High | Not Started |
| Prepare Acceptance Tests for Assigned Features | All Members | High | Not Started |
| Implement Automated Tests for Assigned Features | All Members | High | Not Started |
| Ensure Assigned Tests Execute Through CI/CD | All Members | High | Not Started |
| Review Sprint 4 Pull Requests | All Members | High | Not Started |
| Resolve Static Analysis Issues in Assigned Code | All Members | High | Not Started |
| Execute Integration Tests and Report Bugs | All Members | High | Not Started |
| Maintain AI Usage and Contribution Logs | All Members | High | Not Started |
| Prepare Sprint 4 Summary Report | Yassen / All Members | High | Not Started |
| Prepare Final Application Demonstration | All Members | High | Not Started |

## 7. Acceptance Testing

**Testing Coordinator:** Julia Kyrychuk  
**GitHub Issue Management:** Noor Rabie  
**Test Contributors:** All Team Members

At least one acceptance test or corresponding verification check will be created for each applicable Sprint 4 user story.

With 15 user stories, the team will prepare at least 15 acceptance tests or verification checks, including tests for AI functionality, privacy protection, software maintenance, and application functionality.

Each team member is individually responsible for creating and executing acceptance tests associated with their assigned user stories.

Julia will coordinate acceptance testing and final regression testing. She will not be solely responsible for creating acceptance tests for the entire application.

**Planned Activities**

- Create acceptance tests for assigned user stories.
- Link tests to corresponding GitHub Issues.
- Define expected outcomes.
- Validate AI-generated feedback and recommendations.
- Test invalid inputs and AI service failures.
- Execute tests against implemented functionality.
- Record test results.
- Report identified bugs.
- Verify corrected functionality.
- Document final acceptance testing results.

**Proposed Target Dates**

- November 24–26: Create and organize acceptance tests.
- November 27–29: Execute tests and report issues.
- November 30: Complete testing and verify fixes.

## 8. Continuous Integration & Unit Testing

**CI/CD Coordinator:** Yassen Hegazy  
**Static Analysis Coordinator:** Michel Yosufov  
**Test Contributors:** All Team Members

**Target Completion:** November 30, 2026 (proposed)

The CI/CD pipeline and automated testing infrastructure were implemented during Sprint 3.

Sprint 4 will build upon the existing infrastructure rather than recreate it.

Every team member is individually responsible for implementing, maintaining, and executing automated tests for their assigned user stories.

### Individual Testing Responsibilities

Each developer must:

- Implement unit tests for every assigned application feature.
- Implement relevant integration and acceptance tests.
- Cover expected behaviour, edge cases, and failure scenarios.
- Include automated tests within the corresponding feature pull request.
- Ensure newly implemented tests execute automatically through the existing CI/CD pipeline.
- Maintain tests associated with previously implemented functionality.
- Resolve failing tests associated with their own implementation.
- Verify that all required CI checks pass before merging.

A feature will not be considered complete until its relevant automated tests have been implemented and successfully executed through CI/CD.

### CI/CD Coordinator Responsibilities

Yassen will be responsible for:

- Maintaining the existing GitHub Actions CI/CD pipeline.
- Verifying that newly implemented tests execute automatically.
- Monitoring pipeline execution.
- Resolving infrastructure-related CI/CD configuration errors.
- Identifying gaps in application test coverage.
- Communicating testing requirements to team members.
- Coordinating final CI/CD verification.
- Documenting successful pipeline execution.

The CI/CD coordinator is not responsible for implementing automated tests for features assigned to other developers.

### Static Analysis Responsibilities

Michel will be responsible for:

- Integrating static analysis into the existing CI/CD pipeline.
- Configuring appropriate static analysis tools.
- Identifying and documenting bugs, vulnerabilities, and code smells.
- Linking static analysis findings to corresponding GitHub Issues.
- Coordinating software maintenance activities.
- Verifying that identified issues have been addressed.

Each developer is responsible for resolving static analysis issues associated with their respective code.

Testing and software quality are shared development responsibilities.

## 9. Scrum Master Responsibilities

**Responsible:** Yassen Hegazy

### Sprint Planning

- Facilitate Sprint 4 planning.
- Coordinate task assignments.
- Establish priorities and deadlines.
- Ensure user stories are broken into development tasks.
- Ensure individual workloads remain balanced.
- Communicate Sprint 4 testing and software quality requirements.

### Sprint Monitoring

- Maintain the GitHub Project Board.
- Track task progress.
- Identify blockers.
- Coordinate communication between team members.
- Ensure GitHub Issues remain updated.
- Monitor CI/CD pipeline execution.
- Verify that developers implement tests for their assigned features.
- Coordinate pull request reviews.
- Monitor completion of static analysis and maintenance activities.

### Sprint Delivery

- Monitor completion of required deliverables.
- Coordinate sprint documentation.
- Verify completion of software quality requirements.
- Ensure contribution logs and AI usage logs are maintained.
- Organize the final application demonstration.
- Prepare the Sprint 4 Summary Report.
- Ensure the repository reflects the final project state.

## 10. Sprint Schedule

The following dates are proposed and should be adjusted to the confirmed evaluation deadline.

| **Date** | **Planned Activities** | **Responsible Members** |
|---|---|---|
| Nov 24 | Finalize sprint plan and distribute responsibilities | Yassen / All Members |
| Nov 25 | Create development tasks, organize GitHub Issues and define acceptance tests | Noor / All Members |
| Nov 26 | Continue AI development, remaining application features and repository organization | All Developers |
| Nov 27 | Integrate AI features, implement privacy protection and configure static analysis | Noor / Jose David / Michel |
| Nov 28 | Complete remaining application functionality and associated automated tests | Yassen / Julia / Noor |
| Nov 29 | Complete AI functionality, validation, static analysis and coding standards | Noor / Jose David / Michel |
| Nov 30 | Execute acceptance tests, automated unit tests, regression tests and CI/CD verification | All Members |
| Dec 1 | Final code reviews, integration testing and bug fixes | All Members |
| Before Evaluation | Prepare final demonstration, summary report and individual documentation | All Members |

Automated tests and code reviews will be completed continuously throughout development rather than postponed until the end of the sprint.

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
- Implementing automated unit tests for their assigned features.
- Implementing relevant integration and acceptance tests.
- Including tests in their feature pull requests.
- Ensuring their tests execute automatically through CI/CD.
- Resolving failing tests associated with their implementation.
- Testing previously implemented functionality.
- Resolving static analysis issues associated with their code.
- Communicating blockers and delays.
- Contributing to final documentation and demonstration preparation.

Each team member is accountable for both the implementation and quality of their assigned functionality.

## 12. Definition of Done

A task is considered complete when:

- Required functionality has been implemented.
- The user story's acceptance criteria have been satisfied.
- The responsible developer has implemented relevant automated tests.
- Automated tests are included in the corresponding feature pull request.
- Newly implemented tests execute automatically through CI/CD.
- Relevant acceptance tests have passed.
- Unit and integration tests have passed.
- Code complies with established coding standards.
- Code and associated tests have been reviewed and approved by at least one other team member.
- Identified static analysis issues have been addressed where applicable.
- All required CI checks pass.
- Changes have been merged into the appropriate branch.
- GitHub Issue status has been updated.
- Contribution logs and AI usage logs have been updated where applicable.
- Relevant technical documentation has been completed.

## 13. Expected Sprint 4 Deliverables

- Completed AI-Powered Resume Feedback Feature.
- Completed AI Job Matching Feature.
- AI Feature Validation and Technical Documentation.
- Completed Remaining Mandatory Application Functionality.
- Acceptance Tests for Sprint 4 User Stories.
- Automated Unit Tests Implemented by Each Responsible Developer.
- Automated Integration Tests Where Applicable.
- Maintained and Functional CI/CD Pipeline.
- Verified Automatic Execution of Newly Implemented Tests.
- Reorganized Repository Structure.
- Static Analysis Integration and Maintenance Documentation.
- Documented Coding Standards.
- Sprint 4 Pull Request Review Records.
- Updated GitHub Project Board and Sprint Backlog.
- Individual Contribution Logs.
- Updated AI Usage Logs.
- Individual Sprint 4 PDF Reports in Each Member's AI_Log Directory.
- Sprint 4 Summary Report.
- Updated Meeting Minutes.
- Final Demonstration of the CareerConnect Platform.

## 14. Sprint Completion Criteria

Sprint 4 will be considered ready for evaluation when:

- All mandatory core features have been implemented.
- At least two Generative AI features have been completed, integrated, and validated.
- AI privacy considerations, limitations, and failure handling have been documented.
- Acceptance tests have been created and linked to user stories.
- Each developer has implemented automated tests for their assigned features.
- Automated unit tests cover application functionality and execute through CI/CD.
- The existing CI/CD pipeline remains functional.
- All required CI checks pass.
- Static analysis has been integrated into the CI pipeline.
- Identified software quality issues have been documented and addressed.
- All Sprint 4 pull requests have been reviewed by at least one other team member.
- The repository follows a consistent and maintainable structure.
- Previous sprint functionality has been reviewed and integrated.
- All required documentation has been updated.
- Individual contributions have been recorded.
- Individual AI usage logs and Sprint 4 PDF reports have been completed.
- The team has prepared the final demonstration.
- The GitHub repository reflects the final project state.

