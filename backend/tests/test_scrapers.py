from datetime import date
from unittest.mock import patch

from app.models.enums import OpportunityCategory
from pipeline.runner import ADAPTER_REGISTRY, run_adapter_pipeline
from scrapers.company import CompanyCareerAdapter
from scrapers.devpost import DevpostAdapter
from scrapers.remotive import RemotiveAdapter
from scrapers.unstop import UnstopAdapter


def test_scraper_registry():
    assert "unstop" in ADAPTER_REGISTRY
    assert "devpost" in ADAPTER_REGISTRY
    assert "company_careers" in ADAPTER_REGISTRY
    assert "remotive" in ADAPTER_REGISTRY


def test_unstop_parser():
    adapter = UnstopAdapter()
    sample_raw = [
        {
            "title": "National AI Hackathon",
            "organisation": {"name": "Tech Institute"},
            "type": "hackathons",
            "public_url": "hackathons/national-ai-hackathon-12345",
            "details": "<p>Build exciting <b>AI models</b> for smart cities.</p>",
            "end_date": "2026-10-15T23:59:00+05:30",
            "tags": [{"name": "Python"}, {"name": "AI"}],
            "prizes": [{"name": "First Prize", "amount": 50000}],
            "region": "online",
        },
        {
            "title": "Software Intern",
            "organisation": "TechCorp",
            "type": "internships",
            "public_url": "internships/software-intern-67890",
            "details": "Join as an intern.",
            "region": "offline",
            "locations": [{"city": "Jaipur"}],
            "isPaid": True,
        }
    ]

    drafts = adapter.parse(sample_raw)
    assert len(drafts) == 2

    # Hackathon check
    h = drafts[0]
    assert h.title == "National AI Hackathon"
    assert h.organization == "Tech Institute"
    assert h.category == OpportunityCategory.hackathon
    assert h.application_url == "https://unstop.com/hackathons/national-ai-hackathon-12345"
    assert h.deadline == date(2026, 10, 15)
    assert "First Prize: INR 50000" in (h.prize or "")
    assert h.mode == "remote"
    assert "python" in h.skills

    # Internship check
    i = drafts[1]
    assert i.title == "Software Intern"
    assert i.organization == "TechCorp"
    assert i.category == OpportunityCategory.internship
    assert i.location == "Jaipur"
    assert i.is_paid is True


def test_company_career_parser():
    adapter = CompanyCareerAdapter()
    sample_raw = [
        {
            "title": "Frontend Engineering Intern",
            "_company_name": "Stripe",
            "absolute_url": "https://stripe.com/jobs/intern-1",
            "location": {"name": "Remote, US"},
        }
    ]

    drafts = adapter.parse(sample_raw)
    assert len(drafts) == 1
    d = drafts[0]
    assert d.organization == "Stripe"
    assert d.category == OpportunityCategory.internship
    assert d.mode == "remote"
    assert "react" in d.skills or "software engineering" in d.skills


def test_remotive_parser():
    adapter = RemotiveAdapter()
    sample_raw = [
        {
            "title": "Fullstack Python Developer",
            "company_name": "CloudNine",
            "url": "https://remotive.com/job/123",
            "description": "<p>Write Python and React.</p>",
            "category": "software-dev",
            "tags": ["python", "react"],
            "salary": "$80,000",
        }
    ]

    drafts = adapter.parse(sample_raw)
    assert len(drafts) == 1
    d = drafts[0]
    assert d.title == "Fullstack Python Developer"
    assert d.organization == "CloudNine"
    assert d.category == OpportunityCategory.job
    assert "python" in d.skills
    assert "$80,000" in (d.prize or "")


def test_scrapers_api_list_and_logs(client):
    # Test GET /api/scrapers
    resp = client.get("/api/scrapers")
    assert resp.status_code == 200
    sources = resp.json()
    assert len(sources) >= 3
    source_names = [s["name"] for s in sources]
    assert "unstop" in source_names
    assert "company_careers" in source_names
    assert "remotive" in source_names

    # Test GET /api/scrapers/logs
    logs_resp = client.get("/api/scrapers/logs")
    assert logs_resp.status_code == 200
    assert isinstance(logs_resp.json(), list)


def test_devpost_parser():
    adapter = DevpostAdapter()
    sample_raw = [
        {
            "title": "Global AI Challenge 2026",
            "url": "https://global-ai.devpost.com",
            "organization_name": "Devpost Org",
            "prize_amount": "$<span data-currency-value>50,000</span>",
            "submission_period_dates": "Jul 01 - Oct 25, 2026",
            "themes": [{"name": "AI"}, {"name": "Machine Learning"}],
            "displayed_location": {"location": "Online"},
        }
    ]

    drafts = adapter.parse(sample_raw)
    assert len(drafts) == 1
    d = drafts[0]
    assert d.title == "Global AI Challenge 2026"
    assert d.organization == "Devpost Org"
    assert d.category == OpportunityCategory.hackathon
    assert "$50,000" in (d.prize or "")
    assert d.deadline == date(2026, 10, 25)
    assert d.mode == "remote"
    assert "ai" in d.skills


def test_scrapers_status_api(client):
    resp = client.get("/api/scrapers/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_running" in data
    assert "next_scrape_at" in data
    assert "seconds_remaining" in data
    assert "interval_seconds" in data
    assert data["interval_seconds"] == 86400
    assert data["interval_hours"] == 24
    assert isinstance(data["sources"], list)


def test_scrapers_refresh_api(client):
    with patch("app.core.scheduler.scraper_scheduler.execute_scrape") as mock_exec:
        mock_exec.return_value = [
            {"source": "unstop", "records_found": 10, "records_added": 2, "duplicates": 8, "errors": 0}
        ]
        resp = client.post("/api/scrapers/refresh")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert "Sync complete!" in data["message"]
        assert "scheduler" in data

