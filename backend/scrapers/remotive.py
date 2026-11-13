from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.models.enums import OpportunityCategory
from scrapers.base import OpportunityDraft, ScraperAdapter


class RemotiveAdapter(ScraperAdapter):
    source_name = "remotive"
    source_type = "job"

    API_URL = "https://remotive.com/api/remote-jobs"

    def __init__(self, limit: int = 15):
        self.limit = limit

    def fetch(self) -> list[dict[str, Any]]:
        raw_items: list[dict[str, Any]] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }

        with httpx.Client(timeout=12.0, headers=headers) as client:
            try:
                resp = client.get(
                    self.API_URL,
                    params={"category": "software-dev", "limit": self.limit},
                )
                if resp.status_code == 200:
                    raw_items = resp.json().get("jobs", [])
            except Exception as exc:
                print(f"Error fetching Remotive jobs: {exc}")

        return raw_items[: self.limit]

    def parse(self, raw_items: list[dict[str, Any]]) -> list[OpportunityDraft]:
        drafts: list[OpportunityDraft] = []

        for item in raw_items:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            company = item.get("company_name") or "Tech Company"
            url = item.get("url") or ""
            if not url:
                continue

            # Description
            raw_desc = item.get("description") or ""
            if raw_desc:
                soup = BeautifulSoup(raw_desc, "html.parser")
                clean_desc = re.sub(r"\n\s*\n", "\n\n", soup.get_text(separator="\n").strip())
            else:
                clean_desc = None

            # Category
            title_lower = title.lower()
            if "intern" in title_lower:
                category = OpportunityCategory.internship
            else:
                category = OpportunityCategory.job

            # Location / Mode
            location = item.get("candidate_required_location") or "Worldwide / Remote"
            mode = "remote"

            # Domain
            job_category = (item.get("category") or "").lower()
            if "data" in job_category or "ai" in title_lower or "ml" in title_lower:
                domain = "AI/ML"
            elif "devops" in job_category or "cloud" in title_lower:
                domain = "Cloud / DevOps"
            elif "front" in title_lower or "react" in title_lower:
                domain = "Web Development"
            else:
                domain = "Software Development"

            # Skills
            skills = [t.lower().strip() for t in (item.get("tags") or []) if t]
            if not skills:
                for kw in ["python", "react", "javascript", "typescript", "fastapi", "docker", "aws", "sql"]:
                    if kw in (clean_desc or "").lower():
                        skills.append(kw)

            # Salary / Stipend
            salary = item.get("salary")
            prize_str = f"Compensation: {salary}" if salary else None

            drafts.append(
                OpportunityDraft(
                    title=title,
                    organization=company,
                    category=category,
                    source=self.source_name,
                    application_url=url,
                    source_url=url,
                    description=clean_desc,
                    domain=domain,
                    location=location,
                    skills=skills[:6],
                    is_paid=True,
                    prize=prize_str,
                    mode=mode,
                    posted_at=datetime.now(timezone.utc),
                )
            )

        return drafts
