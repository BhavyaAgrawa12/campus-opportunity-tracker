from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.models.enums import OpportunityCategory
from scrapers.base import OpportunityDraft, ScraperAdapter


class UnstopAdapter(ScraperAdapter):
    source_name = "unstop"
    source_type = "aggregator"

    BASE_API_URL = "https://unstop.com/api/public/opportunity/search-result"
    BASE_WEB_URL = "https://unstop.com"

    def __init__(self, per_category_limit: int = 15):
        self.limit = per_category_limit

    def fetch(self) -> list[dict[str, Any]]:
        categories = ["hackathons", "internships", "jobs"]
        raw_items: list[dict[str, Any]] = []

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json",
        }

        with httpx.Client(timeout=15.0, headers=headers) as client:
            for cat in categories:
                try:
                    resp = client.get(
                        self.BASE_API_URL,
                        params={"opportunity": cat, "per_page": self.limit},
                    )
                    if resp.status_code == 200:
                        data = resp.json().get("data", {}).get("data", [])
                        for item in data:
                            item["_target_category"] = cat
                            raw_items.append(item)
                except Exception as exc:
                    print(f"Error fetching Unstop category {cat}: {exc}")

        return raw_items

    def parse(self, raw_items: list[dict[str, Any]]) -> list[OpportunityDraft]:
        drafts: list[OpportunityDraft] = []

        for item in raw_items:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            # Organization
            org_data = item.get("organisation")
            if isinstance(org_data, dict):
                org_name = org_data.get("name") or "Unstop Partner"
            elif isinstance(org_data, str):
                org_name = org_data
            else:
                org_name = "Unstop Partner"

            # Category mapping
            target_cat = (item.get("_target_category") or item.get("type", "")).lower()
            title_lower = title.lower()
            if re.search(r"\bhackathon\b", title_lower) or "hackathon" in target_cat:
                category = OpportunityCategory.hackathon
            elif re.search(r"\bintern(ship)?\b", title_lower) or "internship" in target_cat:
                category = OpportunityCategory.internship
            elif re.search(r"\bscholarship\b", title_lower) or "scholarship" in target_cat:
                category = OpportunityCategory.scholarship
            elif re.search(r"\bworkshop\b", title_lower) or "workshop" in target_cat:
                category = OpportunityCategory.workshop
            else:
                category = OpportunityCategory.job

            # Public URL
            public_path = item.get("public_url") or ""
            if public_path.startswith("http"):
                full_url = public_path
            else:
                full_url = f"{self.BASE_WEB_URL}/{public_path.lstrip('/')}"

            # Clean HTML description
            raw_details = item.get("details") or ""
            if raw_details:
                soup = BeautifulSoup(raw_details, "html.parser")
                clean_description = re.sub(r"\n\s*\n", "\n\n", soup.get_text(separator="\n").strip())
            else:
                clean_description = None

            # Deadline extraction from end_date or regn_end_date
            deadline_date: date | None = None
            date_str = item.get("end_date") or item.get("regn_end_date")
            if date_str:
                try:
                    # ISO string parsing: e.g. 2026-09-27T23:59:00+05:30
                    dt = datetime.fromisoformat(date_str)
                    deadline_date = dt.date()
                except Exception:
                    pass

            # Skills
            skills: list[str] = []
            for req in item.get("required_skills") or []:
                if isinstance(req, dict) and req.get("name"):
                    skills.append(req["name"].lower().strip())
                elif isinstance(req, str):
                    skills.append(req.lower().strip())

            for tag in item.get("tags") or []:
                if isinstance(tag, dict) and tag.get("name"):
                    skills.append(tag["name"].lower().strip())
                elif isinstance(tag, str):
                    skills.append(tag.lower().strip())

            # Dedup skills preserving order
            seen_skills = set()
            clean_skills: list[str] = []
            for s in skills:
                if s and s not in seen_skills:
                    seen_skills.add(s)
                    clean_skills.append(s)

            # Eligibility
            filters = item.get("filters") or []
            eligibility_parts = [
                f["name"] for f in filters if isinstance(f, dict) and f.get("type") == "eligible" and f.get("name")
            ]
            eligibility = ", ".join(eligibility_parts) if eligibility_parts else None

            # Prize
            prizes = item.get("prizes") or []
            prize_str: str | None = None
            if prizes and isinstance(prizes, list):
                first_prize = prizes[0]
                if isinstance(first_prize, dict):
                    amount = first_prize.get("amount") or first_prize.get("prize_amount")
                    name = first_prize.get("name") or "Prize Pool"
                    if amount:
                        prize_str = f"{name}: INR {amount}"
                    elif name:
                        prize_str = name

            # Mode / Location
            region = (item.get("region") or "").lower()
            if region == "online":
                mode = "remote"
                location = "Remote"
            elif region == "offline":
                mode = "onsite"
                locations = item.get("locations") or []
                if locations and isinstance(locations, list):
                    first_loc = locations[0]
                    location = first_loc.get("city") or first_loc.get("name") if isinstance(first_loc, dict) else str(first_loc)
                else:
                    location = "India"
            else:
                mode = "hybrid"
                location = "Hybrid"

            # Domain determination
            domain = "Software Development"
            if category == OpportunityCategory.hackathon:
                domain = "Engineering & Tech"
            elif any(s in ["react", "frontend", "javascript", "html", "css"] for s in clean_skills):
                domain = "Web Development"
            elif any(s in ["python", "ai", "machine learning", "deep learning", "data"] for s in clean_skills):
                domain = "AI/ML"

            drafts.append(
                OpportunityDraft(
                    title=title,
                    organization=org_name,
                    category=category,
                    source=self.source_name,
                    application_url=full_url,
                    source_url=full_url,
                    description=clean_description,
                    domain=domain,
                    location=location,
                    deadline=deadline_date,
                    skills=clean_skills[:6],
                    is_paid=bool(item.get("isPaid")),
                    eligibility=eligibility,
                    prize=prize_str,
                    mode=mode,
                    posted_at=datetime.now(timezone.utc),
                )
            )

        return drafts
