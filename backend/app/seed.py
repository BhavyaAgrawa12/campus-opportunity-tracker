"""Seed the local database with a handful of opportunities.

Run from backend/ with the venv active:

    .venv\Scripts\python.exe -m app.seed

Safe to run repeatedly (checks by title+organization before inserting).
"""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.models.enums import OpportunityCategory, OpportunityStatus
from app.models.opportunity import Opportunity

_SEED = [
    {
        "title": "Software Engineer Intern",
        "organization": "CodeCraft Labs",
        "description": "Build REST APIs with FastAPI and PostgreSQL.",
        "category": OpportunityCategory.internship,
        "domain": "Software Development",
        "location": "Jaipur",
        "deadline": date.today() + timedelta(days=14),
        "event_date": None,
        "skills": ["python", "fastapi", "postgresql"],
        "is_paid": True,
        "experience": "0-1 years",
        "eligibility": "Final-year B.Tech CS students",
        "prize": None,
        "team_size": "3",
        "mode": "onsite",
        "source": "naukri",
        "source_url": "https://www.naukri.com/job-software-engineer-intern",
        "application_url": "https://www.naukri.com/job-application/codecraft-1",
        "posted_at": datetime.now(timezone.utc) - timedelta(days=2),
        "status": OpportunityStatus.active,
    },
    {
        "title": "Hackathon 2026 - Smart Campus",
        "organization": "Unstop",
        "description": "48-hour hackathon to build smart campus solutions.",
        "category": OpportunityCategory.hackathon,
        "domain": "AI/ML",
        "location": "Remote",
        "deadline": date.today() + timedelta(days=7),
        "event_date": date.today() + timedelta(days=30),
        "skills": ["python", "machine-learning", "react"],
        "is_paid": False,
        "experience": None,
        "eligibility": "All college students",
        "prize": "First prize: INR 50,000",
        "team_size": "4",
        "mode": "remote",
        "source": "unstop",
        "source_url": "https://unstop.com/hackathons/smart-campus-2026",
        "application_url": "https://unstop.com/hackathons/smart-campus-2026/register",
        "posted_at": datetime.now(timezone.utc) - timedelta(days=4),
        "status": OpportunityStatus.active,
    },
    {
        "title": "Frontend Developer (React)",
        "organization": "DevDeck",
        "description": "Work on our React dashboard and component library.",
        "category": OpportunityCategory.job,
        "domain": "Frontend",
        "location": "Bengaluru",
        "deadline": date.today() + timedelta(days=21),
        "event_date": None,
        "skills": ["react", "typescript", "tailwind"],
        "is_paid": True,
        "experience": "2+ years",
        "eligibility": "B.Tech / equivalent",
        "prize": None,
        "team_size": None,
        "mode": "hybrid",
        "source": "naukri",
        "source_url": "https://www.naukri.com/job-frontend-react-devdeck",
        "application_url": "https://www.naukri.com/job-application/devdeck-1",
        "posted_at": datetime.now(timezone.utc) - timedelta(days=1),
        "status": OpportunityStatus.active,
    },
    {
        "title": "Salesforce Developer in India - Scholarship",
        "organization": "Trailhead Academy",
        "description": "Paid scholarship covering Salesforce certification course.",
        "category": OpportunityCategory.scholarship,
        "domain": "Cloud",
        "location": "Remote",
        "deadline": date.today() + timedelta(days=45),
        "event_date": None,
        "skills": ["salesforce", "cloud"],
        "is_paid": True,
        "experience": None,
        "eligibility": "Any student, any year",
        "prize": None,
        "team_size": None,
        "mode": "remote",
        "source": "email",
        "source_url": None,
        "application_url": "https://trailhead.salesforce.com/academy/scholarship",
        "posted_at": datetime.now(timezone.utc) - timedelta(days=3),
        "status": OpportunityStatus.active,
    },
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def seed() -> int:
    added = 0
    with SessionLocal() as db:
        for row in _SEED:
            exists = db.scalar(
                select(Opportunity).where(
                    Opportunity.title == row["title"],
                    Opportunity.organization == row["organization"],
                )
            )
            if exists is not None:
                continue
            db.add(Opportunity(**row))
            added += 1
        db.commit()
    return added


if __name__ == "__main__":
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
    print(f"Seeded {seed()} new opportunities.")
