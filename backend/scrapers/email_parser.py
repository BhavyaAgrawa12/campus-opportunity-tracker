from __future__ import annotations

import re
from datetime import date, datetime, timezone
from email import message_from_string
from email.message import Message
from typing import Any
from bs4 import BeautifulSoup

from app.models.enums import OpportunityCategory
from scrapers.base import OpportunityDraft


def extract_links(text: str) -> list[str]:
    url_pattern = re.compile(r"https?://\S+")
    matches = url_pattern.findall(text)
    cleaned = []
    for m in matches:
        m = m.strip("\"'<>.,;!?)")
        if m:
            cleaned.append(m)
    return list(dict.fromkeys(cleaned))


def parse_deadline_from_text(text: str) -> date | None:
    patterns = [
        r"(?:deadline|last\s+date(?:\s+to\s+apply)?|apply\s+by|valid\s+till)\s*[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})",
        r"(?:deadline|last\s+date(?:\s+to\s+apply)?|apply\s+by|valid\s+till)\s*[:\-]?\s*([a-zA-Z]{3,9}\s+[0-9]{1,2}(?:st|nd|rd|th)?,?\s*(?:202[4-9]|203[0-9])?)",
    ]

    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            raw_val = m.group(1).strip()
            for fmt in (
                "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y",
                "%b %d, %Y", "%B %d, %Y", "%b %d %Y", "%B %d %Y",
            ):
                try:
                    return datetime.strptime(raw_val, fmt).date()
                except ValueError:
                    pass
            year_match = re.search(r"\b(202[4-9]|203[0-9])\b", text)
            yr = int(year_match.group(1)) if year_match else datetime.now().year
            for fmt in ("%b %d", "%B %d"):
                try:
                    dt = datetime.strptime(raw_val, fmt)
                    return dt.replace(year=yr).date()
                except ValueError:
                    pass
    return None


def classify_email_content(subject: str, body: str) -> OpportunityCategory:
    combined = f"{subject} {subject} {body}".lower()

    if any(k in combined for k in ["hackathon", "codefest", "ideathon", "devfest", "coding challenge"]):
        return OpportunityCategory.hackathon
    elif any(k in combined for k in ["nomination", "nominate", "fellowship", "scholarship grant"]):
        return OpportunityCategory.nomination
    elif any(k in combined for k in ["scholarship", "financial assistance", "bursary", "tuition waiver"]):
        return OpportunityCategory.scholarship
    elif any(k in combined for k in ["internship", "summer intern", "intern opening", "stipend"]):
        return OpportunityCategory.internship
    elif any(k in combined for k in ["workshop", "bootcamp", "masterclass", "webinar", "guest lecture"]):
        return OpportunityCategory.workshop
    else:
        return OpportunityCategory.job


class EmailOpportunityParser:
    @classmethod
    def parse_raw_email(cls, raw_email_str: str, default_sender: str = "Placement Cell") -> OpportunityDraft | None:
        msg: Message = message_from_string(raw_email_str)
        subject = msg.get("Subject", "Campus Opportunity").strip()
        from_header = msg.get("From", default_sender).strip()

        body_text = ""
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype in ("text/plain", "text/html"):
                    payload = part.get_payload(decode=True)
                    if payload:
                        txt = payload.decode(errors="replace")
                        if ctype == "text/html":
                            txt = BeautifulSoup(txt, "html.parser").get_text(separator=" ")
                        body_text = f"{body_text}\n{txt}"
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                txt = payload.decode(errors="replace")
                if msg.get_content_type() == "text/html":
                    txt = BeautifulSoup(txt, "html.parser").get_text(separator=" ")
                body_text = txt

        return cls.parse_fields(
            subject=subject,
            body_text=body_text.strip(),
            sender=from_header,
        )

    @classmethod
    def parse_fields(
        cls,
        subject: str,
        body_text: str,
        sender: str = "Placement Cell",
    ) -> OpportunityDraft | None:
        if not subject and not body_text:
            return None

        clean_subject = re.sub(r"^(Fwd?:|Re:|\[.*?\])\s*", "", subject, flags=re.IGNORECASE).strip()
        category = classify_email_content(clean_subject, body_text)

        links = extract_links(body_text)
        preferred_link = None
        for link in links:
            lower_link = link.lower()
            if any(k in lower_link for k in ["forms.gle", "google.com/forms", "unstop.com", "apply", "register", "careers"]):
                preferred_link = link
                break
        if not preferred_link and links:
            preferred_link = links[0]
        if not preferred_link:
            preferred_link = f"mailto:{sender}" if "@" in sender else "https://poornima.edu.in/placements"

        org_name = "Campus Placement Cell"
        comp_match = re.search(r"\b(?:hiring|drive|recruitment|at|from)\b\s*[:\-]?\s*([A-Za-z0-9&. ]{2,30})", clean_subject, re.IGNORECASE)
        if comp_match:
            candidate = comp_match.group(1).strip()
            if candidate.lower() not in ["campus", "placement", "students", "all", "urgent"]:
                org_name = candidate
        else:
            for top_comp in ["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro", "Cognizant", "Adobe", "Meta", "Netflix", "Uber", "Salesforce", "Oracle", "Goldman Sachs", "JP Morgan", "Deloitte"]:
                if re.search(rf"\b{re.escape(top_comp)}\b", clean_subject, re.IGNORECASE):
                    org_name = top_comp
                    break

        deadline = parse_deadline_from_text(f"{clean_subject}\n{body_text}")

        skills: list[str] = []
        lower_body = f"{clean_subject}\n{body_text}".lower()
        for kw in ["python", "java", "c++", "react", "sql", "javascript", "machine learning", "aws", "docker", "flutter"]:
            if kw in lower_body:
                skills.append(kw)

        mode = "remote" if "remote" in lower_body or "online" in lower_body else "onsite"
        location = "Remote" if mode == "remote" else "Jaipur (On-Campus)"

        snippet = "\n".join([line.strip() for line in body_text.splitlines() if line.strip()][:6])
        if len(snippet) > 400:
            snippet = snippet[:400] + "..."

        return OpportunityDraft(
            title=clean_subject or "Campus Opportunity",
            organization=org_name,
            category=category,
            source="college_email",
            application_url=preferred_link,
            source_url=preferred_link,
            description=snippet or f"{clean_subject} announced via {sender}",
            domain="Software Development",
            location=location,
            deadline=deadline,
            skills=skills or ["campus", "placement"],
            is_paid=True if category in (OpportunityCategory.job, OpportunityCategory.internship) else None,
            eligibility="Poornima Students (Check email guidelines for branch / CGPA criteria)",
            mode=mode,
            posted_at=datetime.now(timezone.utc),
        )
