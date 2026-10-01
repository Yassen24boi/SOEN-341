# Team Process

This document defines the processes and guidelines that the CareerConnect team will follow throughout the development of the project. These processes are intended to maintain consistency, organize collaboration, and ensure that all team members follow the same development workflow.

---

## Communication

Team members will communicate regularly throughout each sprint to discuss progress, blockers, and upcoming tasks.

- Team members are expected to communicate any blockers that may prevent them from completing assigned work.
- Important project decisions should be communicated to the entire team.
- Sprint meetings will be used to review progress and coordinate upcoming work.
- Meeting minutes will be recorded in the `Documentation/meeting_minutes` folder.

---

## Task Management

GitHub Issues and the GitHub Project Board will be used to organize and monitor project work.

- User stories and development tasks will be created as GitHub Issues.
- Issues will be assigned to the team member responsible for completing them.
- Labels will be used to categorize issues.
- Tasks will move through the Project Board as work progresses.
- Each sprint will contain a defined set of tasks and user stories that the team aims to complete.

---

## Branching Strategy

The team will use a feature-branch workflow to prevent unfinished work from directly affecting the main project.

- `main` — Contains stable versions of the project.
- `develop` — Integration branch where completed features are combined.
- `feature/<issue-id>-short-description` — Used when developing a new feature.
- `bugfix/<issue-id>-short-description` — Used when fixing a bug.

Team members should create their own branch before beginning development on an assigned feature or issue.

Example:

`feature/12-user-login`

---

## Pull Requests and Code Review

Completed work must be reviewed before being integrated into the project.

1. Development work should be associated with a GitHub Issue.
2. Changes should be committed to the appropriate feature or bug-fix branch.
3. A Pull Request should be created when the work is ready for review.
4. Pull Requests should target the `develop` branch.
5. At least one other team member should review and approve the Pull Request.
6. Automated tests and checks should pass before the branch is merged.
7. Completed and tested versions may later be merged from `develop` into `main`.

---

## Definition of Ready (DoR)

A user story or task is considered ready for development when:

- The objective of the task is clearly defined.
- Acceptance criteria have been established.
- Story points or an effort estimate have been assigned.
- Required dependencies have been identified.
- The task has been assigned to a team member.

---

## Definition of Done (DoD)

A task is considered complete when:

- The required functionality has been implemented.
- The code follows the team's agreed development conventions.
- Relevant tests have been completed successfully.
- The work has been reviewed and approved by at least one other team member.
- The branch has been successfully merged into `develop`.
- Related documentation and AI usage logs have been updated when applicable.

---

## Sprint Process

At the beginning of each sprint, the team will:

1. Establish the sprint goal.
2. Select the user stories and tasks to be completed.
3. Assign tasks to team members.
4. Estimate the effort required for each task.
5. Add the selected work to the GitHub Project Board.

Throughout the sprint, team members will update the status of their assigned tasks. At the end of the sprint, completed features will be reviewed and demonstrated, and unfinished work will be evaluated for a future sprint.

---

## Documentation

Project documentation will be maintained throughout development.

- Meeting minutes will be stored in `Documentation/meeting_minutes`.
- Sprint-specific deliverables will be stored in `Sprint_Deliverables`.
- AI usage will be documented in the appropriate `AI_Log` folder.
- The README will contain the general project description, setup instructions, technologies, and repository structure.

---

## Team Responsibilities

All team members are responsible for:

- Completing assigned tasks within the sprint.
- Keeping their GitHub Issues and Project Board tasks updated.
- Communicating blockers to the team.
- Reviewing other members' work when required.
- Following the agreed Git and Pull Request workflow.
- Contributing to project documentation.
