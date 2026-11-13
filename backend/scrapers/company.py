from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

import httpx

from app.models.enums import OpportunityCategory
from scrapers.base import OpportunityDraft, ScraperAdapter


class CompanyCareerAdapter(ScraperAdapter):
    source_name = "company_careers"
    source_type = "company"

    # Default tracked company career boards on public Greenhouse API
    BOARDS = [
        {"name": "Stripe", "id": "stripe"},
        {"name": "Cloudflare", "id": "cloudflare"},
        {"name": "Figma", "id": "figma"},
    ]

    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    def __init__(self, target_keywords: list[str] | None = None, limit_per_company: int = 8):
        self.keywords = [k.lower() for k in (target_keywords or ["intern", "engineer", "developer", "software", "graduate", "analyst"])]
        self.limit = limit_per_company

    def fetch(self) -> list[dict[str, Any]]:
        raw_items: list[dict[str, Any]] = []

        with httpx.Client(timeout=10.0) as client:
            for board in self.BOARDS:
                company_name = board["name"]
                company_id = board["id"]
                try:
                    resp = client.get(f"{self.BASE_URL}/{company_id}/jobs")
                    if resp.status_code == 200:
                        jobs = resp.json().get("jobs", [])
                        matching = []
                        for job in jobs:
                            title_lower = (job.get("title") or "").lower()
                            if any(k in title_lower for k in self.keywords):
                                job["_company_name"] = company_name
                                matching.append(job)
                                if len(matching) >= self.limit:
                                    break
                        raw_items.extend(matching)
                except Exception as exc:
                    print(f"Error fetching careers for {company_name}: {exc}")

        return raw_items

    def parse(self, raw_items: list[dict[str, Any]]) -> list[OpportunityDraft]:
        drafts: list[OpportunityDraft] = []

        for item in raw_items:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            company = item.get("_company_name") or "Tech Company"
            url = item.get("absolute_url") or ""
            if not url:
                continue

            # Determine category
            title_lower = title.lower()
            if "intern" in title_lower:
                category = OpportunityCategory.internship
            else:
                category = OpportunityCategory.job

            # Location
            loc_data = item.get("location")
            location = loc_data.get("name") if isinstance(loc_data, dict) else "Global / Remote"
            mode = "remote" if "remote" in location.lower() else "onsite"

            # Domain
            domain = "Software Development"
            if "ai" in title_lower or "ml" in title_lower or "machine learning" in title_lower:
                domain = "AI/ML"
            elif "frontend" in title_lower or "web" in title_lower:
                domain = "Web Development"
            elif "cloud" in title_lower or "devops" in title_lower or "infrastructure" in title_lower:
                domain = "Cloud / DevOps"

            # Skills from title
            extracted_skills = []
            for kw in ["python", "react", "java", "golang", "c++", "cloud", "aws", "data", "ai", "security"]:
                if kw in title_lower:
                    extracted_skills.append(kw)
            if not extracted_skills:
                extracted_skills = ["software engineering", "computer science"]

            drafts.append(
                OpportunityDraft(
                    title=title,
                    organization=company,
                    category=category,
                    source=self.source_name,
                    application_url=url,
                    source_url=url,
                    description=f"{title} position at {company}. Direct official application through {company}'s career portal.",
                    domain=domain,
                    location=location,
                    skills=extracted_skills,
                    is_paid=True,
                    eligibility="Students & Recent Graduates (Check official listing for specific degree requirements)",
                    mode=mode,
                    posted_at=datetime.now(timezone.utc),
                )
            )

        return drafts
