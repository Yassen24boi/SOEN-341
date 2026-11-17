# Sprint 3 Summary Report

**Project:** CareerConnect – Job Search and Application Tracking Platform  
**Course:** SOEN 341 – Software Process

### 1. Sprint Objectives

Sprint 3 focused on enhancing CareerConnect's job seeker and recruiter experience through improved application management, dashboard analytics, notifications, and the introduction of AI-powered features. The main objectives included implementing application history and status tracking, recruiter application management, interview invitations, automated notifications, and strengthening the continuous integration testing pipeline.

### 2. Features and Functionality Implemented

The team worked on expanding recruiter functionality through candidate review, application status updates, job posting management, and application filtering and sorting (US-20 to US-24). On the job seeker side, development focused on application history, status breakdowns, and job-search activity visualization (US-25 to US-27).

A notification system was implemented (US-28, US-29, and US-32), allowing users to view and manage notifications, receive updates when application statuses change, and notify recruiters when new applications are submitted. The system includes unread notification tracking, notification management, and navigation links to relevant application sections.

Additional development focused on interview invitations (US-30), application deadline reminders (US-31), and the initial development of AI-powered resume feedback and job matching (US-33 and US-34). Automated unit testing and continuous integration improvements (US-35) were also included in the sprint scope.

### 3. Team Innovation and Original Features

A key feature introduced during Sprint 3 was the **in-app notification system**, which improves communication between recruiters and job seekers. Notifications are automatically generated when recruiters update application statuses or receive new applications, allowing users to stay informed about important recruitment activities.

The team also began incorporating **AI-powered resume feedback and job matching**, aiming to provide personalized recommendations and improve the efficiency of the job-search process. These AI capabilities are planned to continue developing during Sprint 4.

### 4. Challenges and Resolutions

The team encountered challenges coordinating interconnected features, particularly integrating application status updates and job submissions with the notification system. These were addressed by connecting notification creation to existing backend application routes and storing notification records in MongoDB.

Additional challenges involved frontend navigation, authentication configuration, and maintaining compatibility between newly implemented functionality and existing features. GitHub pull requests, peer reviews, and communication through Discord supported collaboration and integration. Further testing and improvements are planned for Sprint 4.

### 5. Team Contributions

- **Yassen Hegazy:** Served as Scrum Master, coordinated sprint activities, and implemented the notification system (US-28, US-29, and US-32), including backend notification creation, MongoDB integration, frontend notification management, and navigation functionality. Also took responsibility for automated unit testing and CI improvements (US-35).
- **Julia Kyrychuk:** Worked on job seeker dashboard functionality (US-25 to US-27), including application history, application status breakdowns, and job-search activity visualization.
- **Michel:** Worked on recruiter dashboard improvements (US-20 to US-22), including job posting management, archiving and restoring postings, and application filtering and sorting.
- **Jose David Torres:** Worked on application management functionality (US-23, US-24, and US-31), including candidate review, application status updates, and application deadline reminders.
- **Noor Rabie:** Worked on interview invitations (US-30) and the initial development of AI-powered resume feedback and job matching (US-33 and US-34), with continued development planned for Sprint 4.

### 6. Repository Reference

**GitHub Repository:** Yassen24boi/SOEN-341
