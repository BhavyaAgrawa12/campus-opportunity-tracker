"""Ingest real-world opportunities from active adapters into the database.

Usage:
    .venv/bin/python3 -m app.ingest
"""

from datetime import datetime, timezone
from sqlalchemy import select, delete

from app.core.database import SessionLocal
from app.models.enums import OpportunityStatus
from app.models.opportunity import Opportunity
from scrapers.unstop import UnstopAdapter


def ingest_live_opportunities() -> int:
    print("Fetching live opportunities from Unstop...")
    adapter = UnstopAdapter(per_category_limit=10)
    drafts = adapter.run()
    print(f"Fetched {len(drafts)} drafts from Unstop.")

    count = 0
    with SessionLocal() as db:
        # Remove old mock/dummy seed opportunities with broken URLs
        db.execute(
            delete(Opportunity).where(
                Opportunity.application_url.in_([
                    "https://www.naukri.com/job-application/codecraft-1",
                    "https://www.naukri.com/job-application/devdeck-1",
                    "https://trailhead.salesforce.com/academy/scholarship",
                    "https://unstop.com/hackathons/smart-campus-2026/register"
                ])
            )
        )

        for draft in drafts:
            # Check if this opportunity URL already exists
            existing = db.scalar(
                select(Opportunity).where(
                    (Opportunity.application_url == draft.application_url) |
                    ((Opportunity.title == draft.title) & (Opportunity.organization == draft.organization))
                )
            )

            if existing:
                # Update existing record
                existing.description = draft.description or existing.description
                existing.deadline = draft.deadline or existing.deadline
                existing.skills = draft.skills or existing.skills
                existing.prize = draft.prize or existing.prize
                existing.status = OpportunityStatus.active
            else:
                new_opp = Opportunity(
                    title=draft.title,
                    organization=draft.organization,
                    description=draft.description,
                    category=draft.category,
                    domain=draft.domain,
                    location=draft.location,
                    deadline=draft.deadline,
                    skills=draft.skills,
                    is_paid=draft.is_paid,
                    eligibility=draft.eligibility,
                    prize=draft.prize,
                    mode=draft.mode,
                    source=draft.source,
                    source_url=draft.source_url,
                    application_url=draft.application_url,
                    posted_at=draft.posted_at or datetime.now(timezone.utc),
                    status=OpportunityStatus.active,
                )
                db.add(new_opp)
                count += 1

        db.commit()

    print(f"Successfully committed {count} new live opportunities to the database.")
    return count


if __name__ == "__main__":
    ingest_live_opportunities()
