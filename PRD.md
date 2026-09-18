# Campus Opportunity Tracker

**Automated Web Scraping and Centralized Opportunity Aggregation Platform**

**Document Version:** 1.0
**Status:** Draft — for review
**Date:** 10 September 2026
**Owner:** Project Team – Campus Opportunity Tracker
**Document Type:** Minor / Academic Project – Product Requirements Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Objectives](#3-goals-and-objectives)
4. [Target Users and Personas](#4-target-users-and-personas)
5. [Scope](#5-scope)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Data Model](#9-data-model)
10. [Key User Flows](#10-key-user-flows)
11. [Technology Stack](#11-technology-stack)
12. [Success Metrics (KPIs)](#12-success-metrics-kpis)
13. [Milestones and Roadmap](#13-milestones-and-roadmap)
14. [Risks and Mitigations](#14-risks-and-mitigations)
15. [Future Scope](#15-future-scope)

---

## 1. Executive Summary

Students seeking jobs, internships, hackathons, nominations, scholarships, and workshops must currently search across many disconnected platforms — job portals, hackathon sites, company career pages, and email inboxes. Important opportunities are frequently missed because information is scattered and time-sensitive.

Campus Opportunity Tracker is a centralized, web-based platform that automatically aggregates opportunities from multiple publicly accessible and permitted sources using source-specific web scraping and designated-mailbox email extraction. Collected data is cleaned, normalized, categorized, deduplicated, and surfaced through a personalized dashboard with search, filtering, deadline tracking, saved opportunities, and application tracking.

This document defines the product's purpose, requirements, architecture, and success criteria to guide design, development, and evaluation of the system as a college minor project with genuine software-engineering depth.

---

## 2. Problem Statement

Students currently need to manually visit multiple websites and monitor several channels to discover relevant opportunities. This creates the following problems:

- Opportunity information is distributed across many unrelated platforms.
- Students often do not know where to search for a given opportunity type.
- New opportunities are published frequently and deadlines are easy to miss.
- Searching for domain-specific roles (e.g. AI/ML, Web Development) is time-consuming.
- Hackathon and nomination emails get buried in cluttered inboxes.
- The same opportunity often appears on multiple sources with slightly different details.
- No single dashboard exists that gives a personalized, deduplicated view of relevant opportunities.

There is a clear need for an automated system that collects, organizes, filters, and presents opportunities from multiple sources in one place.

---

## 3. Goals and Objectives

### 3.1 Main Objective

To develop an automated platform that collects relevant jobs, internships, hackathons, nominations, and other opportunities from multiple permitted web and email sources, processes and categorizes the collected information, and presents it through a centralized, personalized dashboard.

### 3.2 Key Objectives

| # | Objective | Description |
|---|---|---|
| 1 | Automated Data Collection | Collect opportunities from multiple sources on a schedule instead of manual searching. |
| 2 | Domain-Based Extraction | Prioritize jobs/internships matching a student's declared domain and skills. |
| 3 | Hackathon Extraction | Collect hackathons/competitions from Unstop and other permitted sources. |
| 4 | Email Opportunity Extraction | Identify and structure opportunity data from a designated mailbox/folder. |
| 5 | Data Cleaning | Normalize inconsistent fields collected from different sources. |
| 6 | Duplicate Detection | Prevent the same opportunity from appearing multiple times. |
| 7 | Centralized Dashboard | Present all opportunities in one searchable, filterable interface. |
| 8 | Deadline Tracking | Surface and prioritize opportunities nearing their deadline. |
| 9 | Personalization | Let users set interests, domain, location, and job-type preferences. |

---

## 4. Target Users and Personas

| Persona | Description | Primary Needs |
|---|---|---|
| Student (Primary User) | Undergraduate/postgraduate student looking for jobs, internships, hackathons, or scholarships. | Personalized feed, deadline alerts, saved list, application tracking. |
| Placement/Club Coordinator | Manages campus-wide opportunity communication. | Reliable aggregation, ability to flag/curate high-value opportunities. |
| Administrator | Maintains the platform and its data sources. | Source health monitoring, scraper management, data quality control. |

---

## 5. Scope

### 5.1 In Scope

- Web scraping of publicly accessible / permitted job, internship, and hackathon sources.
- Source-specific scraper adapters (Naukri, Indeed, Unstop, company career pages, and similar permitted sources).
- Designated-mailbox email parsing for opportunity announcements.
- Data cleaning, normalization, categorization, and duplicate detection pipeline.
- User authentication and profile-based personalization.
- Centralized dashboard with search, filters, saved opportunities, and deadline tracking.
- Basic application-status tracker (Saved → Applied → Shortlisted → Interview → Selected/Rejected).
- Notification system (email and in-app; Telegram/Discord optional).
- Admin dashboard for source and scraper management.

### 5.2 Out of Scope (Version 1)

- Bypassing CAPTCHA, login walls, or anti-bot mechanisms on any source — sources requiring this are either accessed via an official API/permitted feed or excluded from the live system.
- Full inbox access — only a designated mailbox/folder is processed.
- AI-based resume matching or recommendation engine (deferred to Future Scope).
- Native mobile application (deferred to Future Scope).

---

## 6. Functional Requirements

### 6.1 User Authentication and Profile

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Users can register and log in with email/password or OAuth. | Must |
| FR-1.2 | Users can create/edit a profile: education, domain, skills, preferred role, location, remote/on-site preference. | Must |
| FR-1.3 | Profile data drives personalized recommendations on the dashboard. | Must |

### 6.2 Web Scraping Engine

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | System runs source-specific scraper adapters on a fixed schedule (e.g. every few hours). | Must |
| FR-2.2 | Each adapter extracts: title, company, location, job type, required skills, experience, salary (if available), description, application URL, posted date, deadline, and source. | Must |
| FR-2.3 | Adapters use only publicly accessible pages or permitted APIs/feeds; sources that require bypassing access controls are excluded. | Must |
| FR-2.4 | Failed scraping runs are logged with error details for admin review. | Should |
| FR-2.5 | New sources can be added by implementing a new adapter against a common scraper interface. | Should |

### 6.3 Hackathon Scraper

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | System extracts hackathon name, organizer, description, registration deadline, event date, eligibility, prize, team size, mode, location, registration URL, and source. | Must |
| FR-3.2 | Hackathon records are merged into the same opportunity pipeline as jobs (cleaning, categorization, deduplication). | Must |

### 6.4 Email Opportunity Extraction

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | System connects to a designated mailbox/folder via IMAP or provider API — never the user's full personal inbox. | Must |
| FR-4.2 | System identifies opportunity-relevant emails using subject, sender, keywords, body content, links, and dates. | Must |
| FR-4.3 | System classifies each relevant email as Hackathon, Nomination, Competition, Scholarship, Internship, Job, Workshop, Webinar, or Fellowship. | Must |
| FR-4.4 | Extracted fields (event name, organizer, deadline, event date, prize, eligibility, link) are converted into a structured opportunity record. | Must |

### 6.5 Data Processing Pipeline

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Raw scraped/parsed data passes through cleaning and normalization (e.g. standardizing city names, job titles). | Must |
| FR-5.2 | System performs field extraction and automatic categorization (Job / Internship / Hackathon / Nomination / Scholarship / Workshop). | Must |
| FR-5.3 | System performs duplicate detection using company/organizer, title, location, application URL, event date, and title/description similarity. | Must |
| FR-5.4 | Records failing validation (missing required fields) are flagged rather than published. | Should |

### 6.6 Dashboard, Search, and Filtering

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Dashboard shows category counts (Jobs, Hackathons, Internships, Nominations, etc.) and a personalized "Recommended for You" section. | Must |
| FR-6.2 | Users can search opportunities by keyword. | Must |
| FR-6.3 | Users can filter by category, domain, location, deadline, experience, skills, company, source, and paid/unpaid. | Must |
| FR-6.4 | Dashboard displays an "Upcoming Deadlines" panel with days-remaining indicators. | Must |
| FR-6.5 | Opportunities are visually flagged as Closing Soon, Upcoming, Recently Added, or Expired; expired items are auto-hidden from the main view. | Should |

### 6.7 Saved Opportunities and Application Tracking

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Users can save any opportunity to a personal "Saved Opportunities" list. | Must |
| FR-7.2 | Users can track application status: Saved → Applied → Shortlisted → Interview → Selected/Rejected. | Should |
| FR-7.3 | Users can add personal notes to a tracked application. | Could |

### 6.8 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | System sends notifications for new opportunities matching a user's interests. | Should |
| FR-8.2 | System sends deadline-approaching reminders for saved opportunities. | Should |
| FR-8.3 | Notification channels: email and in-app; Telegram/Discord integration is optional. | Could |

### 6.9 Admin Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-9.1 | Admins can manage users, sources, and categories. | Must |
| FR-9.2 | Admins can enable/disable individual scrapers and view their run status and last-run time. | Must |
| FR-9.3 | Admins can view scraping logs: records found, records added, duplicates, and errors. | Must |
| FR-9.4 | Admins can remove incorrect or stale opportunities. | Should |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard search/filter results should return within 2 seconds for typical query loads. |
| Scalability | Scraping and email-parsing jobs run as independent background workers (Celery) so new sources can be added without blocking the API. |
| Reliability | A single failed scraper must not block other scrapers or the dashboard; failures are logged and retried on the next schedule. |
| Security | Passwords hashed (e.g. bcrypt); JWT-based session auth; mailbox credentials/API tokens stored encrypted, never in plain text. |
| Compliance | Scrapers respect robots.txt/access policies of each source; sources that disallow automated access are integrated via an official API or excluded. |
| Maintainability | Each source is implemented as an isolated adapter against a common scraper interface, so sources can be added, modified, or removed independently. |
| Usability | Dashboard is responsive and usable on both desktop and mobile browsers. |
| Data Quality | Duplicate rate after processing should stay below an agreed threshold (e.g. under 5% of published records). |

---

## 8. System Architecture

The platform follows a modular pipeline architecture: source-specific collectors feed a shared processing pipeline, which writes clean records to a relational database exposed through a backend API and consumed by the dashboard.

### 8.1 High-Level Flow

- Multiple sources (job sites, hackathon platforms, designated mailbox) are polled independently.
- Web scrapers and the email parser extract raw data specific to each source.
- Raw data passes through cleaning → categorization → duplicate removal → database storage.
- A backend API (FastAPI) exposes processed opportunities to the web dashboard.

### 8.2 Component Diagram (textual)

`Frontend (React + Tailwind)` → `Backend API (FastAPI)` → `[PostgreSQL | Redis | Auth System]` → `Celery Workers` → `[Job Scraper | Hackathon Scraper | Email Parser]` → `[Job Sources / Career Pages | Hackathon Platforms | Designated Mailbox]`.

### 8.3 Scraper Adapter Design

Rather than one monolithic scraper, the system defines a common **Scraper Interface** with source-specific adapters (e.g. `NaukriAdapter`, `IndeedAdapter`, `UnstopAdapter`, `CompanyCareerAdapter`). This isolates each source's HTML structure, pagination, and rate limits, and allows new sources to be added without touching existing adapters.

---

## 9. Data Model

### 9.1 User

| Field | Type |
|---|---|
| id | UUID / PK |
| name | string |
| email | string, unique |
| password_hash | string |
| domain | string |
| skills | string[] |
| location | string |
| created_at | timestamp |

### 9.2 Opportunity

| Field | Type |
|---|---|
| id | UUID / PK |
| title | string |
| organization | string |
| description | text |
| category | enum: Job / Internship / Hackathon / Nomination / Scholarship / Workshop |
| domain | string |
| location | string |
| deadline | date |
| event_date | date |
| skills | string[] |
| source | string |
| source_url | string |
| application_url | string |
| created_at / updated_at | timestamp |
| status | enum: active / expired / removed |

### 9.3 Application, Saved Opportunity, Source, Scraping Log

| Entity | Key Fields |
|---|---|
| Application | id, user_id (FK), opportunity_id (FK), status, applied_at, notes |
| SavedOpportunity | id, user_id (FK), opportunity_id (FK), saved_at |
| Source | id, name, url, type, status, last_scraped |
| ScrapingLog | id, source_id (FK), started_at, completed_at, records_found, records_added, duplicates, errors |

---

## 10. Key User Flows

### 10.1 Student Onboarding

Register / log in → complete profile (domain, skills, location, preferences) → land on personalized dashboard.

### 10.2 Discovering and Saving an Opportunity

Browse or search dashboard → apply filters → open opportunity detail → Save or open Application URL.

### 10.3 Tracking an Application

Open Saved Opportunities → update status (Applied/Shortlisted/Interview/Selected/Rejected) → add notes.

### 10.4 Automated Collection Cycle (system-driven)

Scheduler triggers Celery workers → each adapter/email parser runs → raw data cleaned and deduplicated → new/updated records written to database → relevant users notified.

---

## 11. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, Chart.js / Recharts |
| Backend | Python, FastAPI |
| Scraping | Playwright, BeautifulSoup, Requests / httpx |
| Database | PostgreSQL |
| Background Processing | Celery, Redis |
| Authentication | JWT, OAuth (where applicable) |
| Email Integration | IMAP / provider API (designated mailbox only) |
| Deployment | Docker; Render / Railway / AWS / Azure |

---

## 12. Success Metrics (KPIs)

| Metric | Target (V1) |
|---|---|
| Sources actively integrated | 5+ permitted sources across job/hackathon/email |
| Scraper run success rate | ≥ 95% of scheduled runs complete without failure |
| Duplicate rate after processing | < 5% of published opportunities |
| Dashboard search/filter response time | < 2 seconds |
| Weekly active student users (pilot) | Baseline established during pilot rollout |
| Opportunities saved per active user / week | Tracked as an engagement indicator |

---

## 13. Milestones and Roadmap

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 1 — Foundation | Weeks 1–2 | Requirements finalized, DB schema, project scaffolding, auth module. |
| Phase 2 — Scraping Core | Weeks 3–5 | Scraper interface, 2–3 job/hackathon adapters, scheduling via Celery. |
| Phase 3 — Processing Pipeline | Weeks 6–7 | Cleaning, categorization, duplicate detection. |
| Phase 4 — Email Extraction | Week 8 | Designated-mailbox parser and classifier. |
| Phase 5 — Dashboard | Weeks 9–10 | Search, filters, saved opportunities, deadline indicators. |
| Phase 6 — Tracking & Notifications | Week 11 | Application tracker, email/in-app notifications. |
| Phase 7 — Admin & Polish | Week 12 | Admin dashboard, QA, deployment, documentation. |

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Source changes HTML structure, breaking a scraper. | Isolate each source behind its own adapter; log and alert on scraper failure; degrade gracefully without affecting other sources. |
| A source restricts or blocks automated access. | Use an official API/permitted feed where available, or exclude the source from the live system — never bypass access controls. |
| Duplicate opportunities inflate the dashboard. | Multi-attribute duplicate detection (title, org, URL, date, similarity) before publishing. |
| Email parser misclassifies unrelated mail. | Restrict to a designated mailbox/folder; use keyword + sender + structure heuristics; allow admin correction. |
| Scraping load causes rate-limiting. | Schedule runs with backoff/delay; respect each source's access policy and rate limits. |

---

## 15. Future Scope

- Personalized recommendation engine based on user behavior.
- Skill-gap analysis against target roles.
- Resume-to-job matching (optional, non-core extension).
- Natural-language opportunity search.
- Native mobile application.
- Additional data sources and organization/company profiles.
- Advanced analytics and opportunity quality scoring.

---

> **One-Line Definition:** Campus Opportunity Tracker is a web-based automated opportunity aggregation platform that uses web scraping and email-based extraction to collect relevant jobs, internships, hackathons, nominations, and competitions from multiple permitted sources, processes and categorizes the data, removes duplicates, and presents personalized opportunities through a centralized dashboard.