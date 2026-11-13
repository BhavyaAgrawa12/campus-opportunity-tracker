from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.models.enums import OpportunityCategory
from scrapers.base import OpportunityDraft, ScraperAdapter


def parse_devpost_date(date_str: str) -> date | None:
    if not date_str:
        return None
    parts = date_str.split("-")
    target = parts[-1].strip()
    for fmt in ("%b %d, %Y", "%B %d, %Y", "%b %d %Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(target, fmt).date()
        except ValueError:
            pass
    year_match = re.search(r"(202[4-9]|203[0-9])", date_str)
    if year_match:
        year = year_match.group(1)
        for fmt in ("%b %d", "%B %d"):
            try:
                dt = datetime.strptime(target, fmt)
                return dt.replace(year=int(year)).date()
            except ValueError:
                pass
    return None


class DevpostAdapter(ScraperAdapter):
    source_name = "devpost"
    source_type = "aggregator"

    API_URL = "https://devpost.com/api/hackathons"

    def __init__(self, limit: int = 15):
        self.limit = limit

    def fetch(self) -> list[dict[str, Any]]:
        raw_items: list[dict[str, Any]] = []
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json",
        }

        try:
            with httpx.Client(timeout=15.0, headers=headers) as client:
                resp = client.get(
                    self.API_URL,
                    params={"challenge_type[]": "online", "sort_by": "Recently+Added"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    raw_items = data.get("hackathons", [])
        except Exception as exc:
            print(f"Error fetching Devpost hackathons: {exc}")

        return raw_items[: self.limit]

    def parse(self, raw_items: list[dict[str, Any]]) -> list[OpportunityDraft]:
        drafts: list[OpportunityDraft] = []

        for item in raw_items:
            title = (item.get("title") or "").strip()
            url = (item.get("url") or "").strip()
            if not title or not url:
                continue

            org_name = (item.get("organization_name") or "Devpost Partner").strip()

            prize_raw = item.get("prize_amount") or ""
            if prize_raw:
                soup = BeautifulSoup(prize_raw, "html.parser")
                prize_text = soup.get_text().strip()
                prize_str = f"Prize Pool: {prize_text}" if prize_text else None
            else:
                prize_str = None

            sub_dates = item.get("submission_period_dates") or ""
            deadline_date = parse_devpost_date(sub_dates)

            themes = item.get("themes") or []
            skills: list[str] = []
            for theme in themes:
                if isinstance(theme, dict) and theme.get("name"):
                    skills.append(theme["name"].lower().strip())
                elif isinstance(theme, str):
                    skills.append(theme.lower().strip())

            loc_data = item.get("displayed_location")
            if isinstance(loc_data, dict):
                loc_name = loc_data.get("location") or "Online"
            else:
                loc_name = str(loc_data) if loc_data else "Online"
            
            mode = "remote" if "online" in loc_name.lower() or not loc_name else "onsite"
            location = "Online / Global" if mode == "remote" else loc_name

            domain = "Software Development"
            skills_str = " ".join(skills)
            if "ai" in skills_str or "machine learning" in skills_str:
                domain = "AI/ML"
            elif "design" in skills_str or "web" in skills_str:
                domain = "Web Development"
            elif "blockchain" in skills_str or "web3" in skills_str:
                domain = "Blockchain"
            else:
                domain = "Engineering & Tech"

            desc = f"{title} — Global competition hosted by {org_name}. Submission period: {sub_dates}. Open to students and developers worldwide."

            drafts.append(
                OpportunityDraft(
                    title=title,
                    organization=org_name,
                    category=OpportunityCategory.hackathon,
                    source=self.source_name,
                    application_url=url,
                    source_url=url,
                    description=desc,
                    domain=domain,
                    location=location,
                    deadline=deadline_date,
                    skills=skills[:6] if skills else ["hackathon", "software engineering"],
                    is_paid=False,
                    eligibility="Open to students and software developers worldwide",
                    prize=prize_str,
                    mode=mode,
                    posted_at=datetime.now(timezone.utc),
                )
            )

        return drafts
