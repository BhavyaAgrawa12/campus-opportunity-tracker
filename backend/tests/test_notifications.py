from __future__ import annotations

from datetime import date, timedelta
from uuid import uuid4


def _register(client):
    email = f"stu.{uuid4().hex[:8]}@learn-poornima.in"
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Bhavya",
            "email": email,
            "password": "secret123!",
            "role": "student",
            "domain": "software",
            "skills": ["python", "react"],
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_notifications_endpoint(client):
    token = _register(client)
    headers = _headers(token)

    # Create an opportunity closing in 2 days
    urgent_payload = {
        "title": "Urgent Hackathon",
        "organization": "Devpost",
        "description": "Urgent closing hackathon",
        "category": "hackathon",
        "domain": "software",
        "location": "Online",
        "deadline": (date.today() + timedelta(days=2)).isoformat(),
        "skills": ["python", "react"],
        "experience": "All",
        "eligibility": "Students",
        "mode": "online",
        "source": "devpost",
        "source_url": "https://devpost.com/urgent-hack",
        "application_url": "https://devpost.com/urgent-hack/apply",
        "status": "active",
    }
    opp_res = client.post("/api/opportunities", json=urgent_payload, headers=headers)
    assert opp_res.status_code == 201
    opp_id = opp_res.json()["id"]

    # Save it for current user
    save_res = client.post("/api/saved", json={"opportunity_id": opp_id}, headers=headers)
    assert save_res.status_code == 201

    # Call /api/notifications
    res = client.get("/api/notifications", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "unread_count" in data
    assert "notifications" in data
    assert len(data["notifications"]) >= 1
    assert any(n["opportunity_id"] == opp_id for n in data["notifications"])
