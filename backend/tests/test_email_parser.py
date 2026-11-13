from datetime import date
from app.models.enums import OpportunityCategory
from scrapers.email_parser import EmailOpportunityParser


def test_email_parser_job():
    raw_email = """From: placement.cell@poornima.edu.in
Subject: Urgent: Google SDE Summer Internship 2026 - Registration Open
Date: Wed, 24 Sep 2026 10:00:00 +0530
Content-Type: text/plain; charset=utf-8

Dear Students,
Google is hiring SDE Interns for Summer 2026.
Eligibility: B.Tech 3rd year students with skills in Python, Java, or C++.
Last date to apply: 15/10/2026.
Register here: https://forms.gle/google-sde-intern-2026
"""

    draft = EmailOpportunityParser.parse_raw_email(raw_email)
    assert draft is not None
    assert "Google SDE Summer Internship" in draft.title
    assert draft.category == OpportunityCategory.internship
    assert draft.organization == "Google"
    assert draft.deadline == date(2026, 10, 15)
    assert draft.application_url == "https://forms.gle/google-sde-intern-2026"
    assert "python" in draft.skills


def test_email_parser_hackathon():
    raw_email = """From: techclub@poornima.edu.in
Subject: Smart India Hackathon 2026 Internal Nominations
Content-Type: text/plain; charset=utf-8

All students interested in participating in the Smart India Hackathon 2026
Deadline: Nov 05, 2026.
Submit your team details at https://unstop.com/hackathons/sih-2026
"""

    draft = EmailOpportunityParser.parse_raw_email(raw_email)
    assert draft is not None
    assert draft.category == OpportunityCategory.hackathon
    assert draft.deadline == date(2026, 11, 5)
    assert draft.application_url == "https://unstop.com/hackathons/sih-2026"
