# Campus Opportunity Tracker — Project Context

This file captures everything decided so far, so development can resume quickly without re-explaining.
Full spec lives in **`PRD.md`** (mirrors `Campus_Opportunity_Tracker_PRD.pdf`, extracted via `pdftotext`).

---

## 1. What we are building

**Campus Opportunity Tracker (COT)** — a centralized web portal for students that aggregates
career opportunities from multiple sources into ONE personalized dashboard:

- **Jobs** — Naukri, Indeed, company career pages
- **Hackathons** — Unstop (and similar permitted platforms)
- **Nominations / jobs / hackathons / events** — from the user's own email inboxes via a designated-mailbox parser

Students get search, filters, deadline tracking, saved opportunities, and an application status
tracker (Saved → Applied → Shortlisted → Interview → Selected/Rejected).

**One-line definition (from PRD):** Automated opportunity aggregation platform that uses web scraping
and email-based extraction to collect relevant jobs, internships, hackathons, nominations, and
competitions from multiple permitted sources, processes and categorizes the data, removes duplicates,
and presents personalized opportunities through a centralized dashboard.

---

## 2. Key decisions & facts (from conversations)

### Email integration (verified)
- User is a student at **Poornima (Group of Institutions**, Jaipur).
- College ID: `2023csbhavya14015@poornima.edu.in` — hosted on **Google Workspace**.
  (Verified via DNS MX lookup → `aspmx.l.google.com`, `alt1..4.aspmx.l.google.com`.)
- Personal email: Gmail.
- Plan: connect via **IMAP (`imap.gmail.com:993`)** using an app password; fallback **Gmail API OAuth**.
- **Risk (test in Week 1):** the college's Google Workspace admin may disable IMAP / app passwords for
  students. Early test required. Fallback = Gmail API OAuth or manual forwarding.
- Approach: fetch only from an allowlist of senders (placement cell, recruiters, HackerRank, CodeChef,
  Unstop, Devfolio, HackerEarth, etc.), classify with keyword scoring, extract fields, dedupe.
- Raw email bodies are NEVER persisted or shown — only structured fields + short snippet.

### Scraping sources (per PRD)
| Source | Type | Notes |
|---|---|---|
| Unstop | Hackathons | Primary, easiest, low risk, no login |
| Naukri | Jobs | Primary, medium risk (bot detection) |
| Indeed | Jobs | Public search HTML |
| Company career pages | Jobs | Generic `CompanyCareerAdapter` |
| Email (college + personal Gmail) | All types | Core differentiator |
| LinkedIn | NOT included | Scraping banned by ToS; excluded in v1 |

### Tech stack (per PRD §11)
- Frontend: **React.js**, Tailwind CSS, Chart.js / Recharts
- Backend: **Python + FastAPI**
- Scraping: **Playwright**, BeautifulSoup, Requests / httpx
- DB: **PostgreSQL**
- Background: **Celery, Redis**
- Auth: **JWT, OAuth** (where applicable)
- Email: **IMAP / provider API** (designated mailbox only)
- Deployment: Docker; Render / Railway / AWS / Azure

### Architecture principles
- Modular pipeline: source collectors → shared processing pipeline → relational DB → FastAPI → dashboard.
- Pipeline stages: **cleaning → categorization → duplicate removal → database storage**.
- **Scraper Interface + adapters** (`NaukriAdapter`, `IndeedAdapter`, `UnstopAdapter`,
  `CompanyCareerAdapter`) — one interface, isolated HTML/pagination/rate-limits per source.
- Celery workers run independently; a single failed scraper never blocks others.
- Respect robots.txt / rate limits; NEVER bypass CAPTCHA/login walls; exclude such sources.
- Dedup: **multi-attribute** (company/organizer, title, location, application URL, event date,
  title/description similarity); duplicate rate target < 5%.

---

## 3. Current codebase state

```
backend/
  requirements.txt        # FastAPI, SQLAlchemy, psycopg3, Pydantic, PyJWT, bcrypt,
                          #   Celery, Redis, httpx, httpx2, bs4, cryptography (Fernet), pytest
  .env                    # DATABASE_URL (Neon PG) + SECRET_KEY + FERNET_KEY (gitignored)
  main.py                 # FastAPI app: CORS, /api/health, lifespan create_all + 24-hr scheduler
  app/core/
    config.py             # pydantic-settings; DATABASE_URL (sqlite default, Neon via .env), REDIS_URL, FERNET_KEY, CORS
    database.py           # SQLAlchemy engine/session/Base/get_db
    security.py           # bcrypt hash/verify + JWT create/decode
    crypto.py             # Fernet encrypt/decrypt_secret for email creds at rest
    scheduler.py          # AsyncIO 24-hr background scheduler (replaces Celery for now)
  app/models/
    enums.py              # UserRole, OpportunityCategory, OpportunityStatus, ApplicationStatus, SourceType, SourceStatus
    user.py               # User (name/email/role/domain/skills/location/education/preferred_role/remote_preference)
    opportunity.py        # Opportunity (full field set incl. hackathon extras: eligibility/prize/team_size/mode + indexes)
    application.py        # Application (6-stage status flow, unique user+opp, notes)
    saved_opportunity.py  # SavedOpportunity (unique user+opp)
    source.py             # Source + ScrapingLog
    email.py              # EmailAccount (Fernet-encrypted IMAP creds) + SenderAllowlist
  app/schemas/            # auth.py, opportunity schemas, application/saved schemas
  app/api/
    deps.py               # oauth2 bearer + get_current_user + DbDep/CurrentUser
    router.py             # api_router (prefix /api) — all routes registered
    routes/
      auth.py             # register / login / me / profile update
      opportunities.py    # search, filter, paginate, CRUD, CSV export, admin delete
      scrapers.py         # list sources, trigger scrape, view logs, toggle source
      email.py            # add/list/delete email accounts, demo ingest, raw ingest
      notifications.py    # list in-app notifications (deadline urgency + skill matches)
  app/services/           # match_scorer.py (profile-based scoring), notification_builder.py
  app/workers/            # celery_app.py + tasks.py (ping stub — Celery optional)
  app/ingest.py           # pipeline runner: scrape → clean → dedup → store
  scrapers/
    base.py               # ScraperAdapter ABC + OpportunityDraft dataclass
    unstop.py             # Unstop hackathon HTML scraper
    devpost.py            # Devpost hackathon scraper
    company.py            # Greenhouse API adapter (company career pages)
    remotive.py           # Remotive remote-jobs JSON API
    email_parser.py       # RFC822 MIME parser + IMAP TLS 993 client + Poornima demo simulator
  pipeline/
    runner.py             # cleaning → normalization → dedup → DB upsert
  tests/                  # 33 pytest tests covering all phases; use SQLite in-memory
frontend/                 # React 18 + Vite + Tailwind CSS (1602 modules, clean build)
  src/
    components/           # Dashboard, KanbanBoard, DeadlineRadar, NotificationCenter, ...
    hooks/                # useOpportunities, useProfile, useNotifications, ...
    pages/                # Home, Opportunity detail, Auth, Admin, ...
PROJECT_PROGRESS.md       # Detailed phase-by-phase completion report
PRD.md                    # Full requirements (mirror of the PDF PRD)
```

Status: **ALL 7 PHASES COMPLETE.** DB live on Neon; 33/33 tests green; frontend build clean.

### Postgres (Neon) notes
- Live DB: Neon cloud Postgres; `DATABASE_URL` lives in `backend/.env` (gitignored, **never commit**).
- URL scheme MUST be `postgresql+psycopg://` (SQLAlchemy defaults `postgresql://` to psycopg2, not installed).
- `psycopg` v3 = the driver. Works with Neon pooler (`-pooler.c-2.us-east-2.aws.neon.tech`).
- IMPORTANT: DDL silently never persists unless wrapped in explicit transaction —
  always `with engine.begin() as conn: Base.metadata.create_all(bind=conn)` (see `app/main.py`).

### Runtime environment (UPDATED — Python 3.14)
- **Python**: 3.14.4 at `/snap/antigravity-cli/24/usr/bin/python3` (snap-managed)
- **DO NOT USE** `backend/.venv/bin/python` — that venv is ABI-incompatible (cp312 `.so` files)
- **SQLAlchemy**: 2.1.8 (2.0.x is incompatible with Python 3.14 — `Union.__getitem__` removed)
- **Run backend server**: `cd backend && python3 -m uvicorn app.main:app --reload --port 8000`
- **Run tests**: `cd backend && python3 -m pytest -v`  ← **33/33 pass, 0 warnings**
- **Run frontend dev**: `cd frontend && PATH="/home/bhavya/Desktop/Projects/campus-opportunity-tracker/.node/dist/bin:$PATH" npm run dev`
- **Build frontend**: `cd frontend && PATH="/home/bhavya/Desktop/Projects/campus-opportunity-tracker/.node/dist/bin:$PATH" npm run build`
- Node.js v20.18.0 at `.node/dist/bin/` (symlinked to PATH)

---

## 4. Data model (per PRD §9)

- **User**: id (UUID/PK), name, email (unique), password_hash, domain, skills (string[]), location, created_at
- **Opportunity**: id, title, organization, description, category (enum Job/Internship/Hackathon/
  Nomination/Scholarship/Workshop), domain, location, deadline (date), event_date (date), skills (string[]),
  source, source_url, application_url, created_at/updated_at, status (enum active/expired/removed)
- **Application**: id, user_id (FK), opportunity_id (FK), status, applied_at, notes
- **SavedOpportunity**: id, user_id (FK), opportunity_id (FK), saved_at
- **Source**: id, name, url, type, status, last_scraped
- **ScrapingLog**: id, source_id (FK), started_at, completed_at, records_found, records_added, duplicates, errors
- Plan also needs (implied by FR-4 email + FR-1 profile): an **email_accounts** table (encrypted IMAP
  credentials) and **sender allowlist** table for the classifier. Use Fernet (`cryptography`) for
  credential encryption at rest.

---

## 5. Functional requirements (summary, see PRD for full table)

- **FR-1** Auth (register/login email+password or OAuth; profile: education, domain, skills, role,
  location, remote/on-site; profile drives personalized recommendations).
- **FR-2** Web scraping engine: source-specific adapters on a schedule; extracts full field set;
  public/permitted pages only; failures logged; easily addable adapters.
- **FR-3** Hackathon scraper: name, organizer, description, reg deadline, event date, eligibility, prize,
  team size, mode, location, registration URL; merged into same pipeline.
- **FR-4** Email extraction: designated mailbox/folder via IMAP or provider API; identify via subject,
  sender, keywords, body, links, dates; classify (Hackathon/Nomination/Competition/Scholarship/Internship/
  Job/Workshop/Webinar/Fellowship); extract structured field record.
- **FR-5** Data pipeline: cleaning/normalization; auto-categorization; multi-attribute dedup; flag (not
  publish) records failing validation.
- **FR-6** Dashboard: category counts, personalized "Recommended for You", keyword search, filters
  (category/domain/location/deadline/experience/skills/company/source/paid-unpaid), Upcoming Deadlines
  panel with days-remaining, flags (Closing Soon/Upcoming/Recently Added/Expired — expired auto-hidden).
- **FR-7** Saved opportunities + application tracking (status flow + personal notes).
- **FR-8** Notifications: new matching opportunities, deadline reminders; email + in-app; Telegram/Discord optional.
- **FR-9** Admin dashboard: manage users/sources/categories; enable/disable scrapers + view run status;
  view scraping logs; remove incorrect/stale opportunities.

---

## 6. Non-functional targets (per PRD §7 & §12)

- Search/filter response < 2 s for typical loads.
- Scraper run success rate ≥ 95% of scheduled runs.
- Duplicate rate after processing < 5%.
- KPI: 5+ permitted sources integrated (job/hackathon/email).
- Responsive on desktop + mobile.
- Security: bcrypt passwords, JWT auth, encrypted mailbox creds/tokens, never plain text.

---

## 7. Roadmap (per PRD §13)

| Phase | Duration | Deliverables |
|---|---|---|
| 1 — Foundation | Weeks 1–2 | Requirements finalized, DB schema, scaffolding, auth module |
| 2 — Scraping Core | Weeks 3–5 | Scraper interface, 2–3 adapters, Celery scheduling |
| 3 — Processing Pipeline | Weeks 6–7 | Cleaning, categorization, duplicate detection |
| 4 — Email Extraction | Week 8 | Designated-mailbox parser + classifier |
| 5 — Dashboard | Weeks 9–10 | Search, filters, saved opportunities, deadline indicators |
| 6 — Tracking & Notifications | Week 11 | Application tracker, email/in-app notifications |
| 7 — Admin & Polish | Week 12 | Admin dashboard, QA, deployment, documentation |

---

## 8. Risks to keep in mind

1. College Google Workspace may block student IMAP/app passwords → verify in Phase 1 week 1.
2. Naukri/Unstop/Indeed change HTML → keep parsing isolated per adapter, log + alert on failure.
3. Bot detection / rate-limiting → rate limits, delays/backoff, respect robots.txt.
4. Duplicates inflating feed → multi-attribute dedup before publish.
5. Email misclassification → restricted mailbox, sender+keyword heuristics, admin correction.
6. Celery + Redis heavy for a minor project → fallback: in-process scheduler (APScheduler) if needed.

---

## 9. Current Status & Verification

- **Phase 1 — Foundation & Security**: COMPLETE (JWT bearer auth, bcrypt, Pydantic v2, SQLAlchemy 2.0).
- **Phase 2 — Scraping Core**: COMPLETE (Unstop, Devpost, Company Careers via Greenhouse API, Remotive).
- **Phase 3 — Processing Pipeline**: COMPLETE (Canonical URL deduplication, multi-attribute entity resolution, auto-expiration).
- **Phase 4 — Email Extraction**: COMPLETE (RFC822 MIME parser, IMAP TLS 993 client, Fernet AES credential encryption, Poornima placement demo simulator).
- **Phase 5 — Frontend Dashboard**: COMPLETE (React 18 + Vite + Tailwind CSS, 24-hr live countdown bar, instant scrape button, faceted search, urgency badges, upcoming deadlines radar).
- **Phase 6 — Application Tracking & Notifications**: COMPLETE (6-stage Kanban board, notes editor, in-app notification center for urgent deadlines and skill matching).
- **Phase 7 — Automation & Administration**: COMPLETE (FastAPI lifespan 24-hr async scheduler, source toggle switches, scraping audit history logs, and on-demand trigger).
- **Verification**: 33 / 33 Pytest automated tests passing; Vite frontend production build clean. Includes student profile management, intelligent match scoring, CSV export, and admin opportunity deletion. Detailed report lives in `PROJECT_PROGRESS.md`.