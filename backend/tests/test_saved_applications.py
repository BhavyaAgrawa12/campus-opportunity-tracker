from datetime import date, timedelta
from uuid import uuid4


def _register(client, email=None, role="student"):
    email = email or f"stu.{uuid4().hex[:8]}@learn-poornima.in"
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Priya",
            "email": email,
            "password": "secret123!",
            "role": role,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _create_opp(client, headers, title="Summer Internship", **overrides):
    payload = {
        "title": title,
        "organization": "Poornima Placement Cell",
        "description": "Paid summer internship for 3rd-year students.",
        "category": "internship",
        "domain": "software",
        "location": "Jaipur",
        "deadline": (date.today() + timedelta(days=20)).isoformat(),
        "skills": ["python", "fastapi"],
        "experience": "0-1",
        "eligibility": "3rd year B.Tech",
        "mode": "onsite",
        "source": "placement-cell",
        "source_url": "https://placements.example.edu/intern-1",
        "application_url": "https://placements.example.edu/intern-1/apply",
        "status": "active",
    }
    payload.update({k: v for k, v in overrides.items() if v is not None})
    resp = client.post("/api/opportunities", json=payload, headers=headers)
    assert resp.status_code in (201, 200), resp.text
    return resp.json()


def test_save_list_and_unsave(client):
    token = _register(client)
    headers = _headers(token)

    opp = _create_opp(client, headers)

    resp = client.post("/api/saved", json={"opportunity_id": opp["id"]}, headers=headers)
    assert resp.status_code == 201, resp.text
    saved_id = resp.json()["id"]

    dup = client.post("/api/saved", json={"opportunity_id": opp["id"]}, headers=headers)
    assert dup.status_code == 409

    listed = client.get("/api/saved", headers=headers)
    assert listed.status_code == 200, listed.text
    saved_items = listed.json()
    assert len(saved_items) == 1
    assert saved_items[0]["id"] == saved_id
    assert saved_items[0]["opportunity"]["id"] == opp["id"]

    removed = client.delete(f"/api/saved/{opp['id']}", headers=headers)
    assert removed.status_code == 204

    after = client.get("/api/saved", headers=headers)
    assert after.status_code == 200, after.text
    assert after.json() == []


def test_application_create_update_delete(client):
    token = _register(client)
    headers = _headers(token)

    opp = _create_opp(client, headers)
    opp_id = opp["id"]

    created = client.post(
        "/api/applications",
        json={"opportunity_id": opp_id, "status": "applied", "notes": "Immediate"},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    app = created.json()
    app_id = app["id"]

    dup = client.post(
        "/api/applications", json={"opportunity_id": opp_id}, headers=headers
    )
    assert dup.status_code == 409

    updated = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "shortlisted", "notes": "Round 1 cleared"},
        headers=headers,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "shortlisted"
    assert updated.json()["notes"] == "Round 1 cleared"

    listed = client.get("/api/applications", headers=headers)
    assert listed.status_code == 200, listed.text
    apps = listed.json()
    assert len(apps) == 1
    assert apps[0]["id"] == app_id
    assert apps[0]["opportunity_id"] == opp_id

    removed = client.delete(f"/api/applications/{app_id}", headers=headers)
    assert removed.status_code == 204

    after = client.get("/api/applications", headers=headers)
    assert after.status_code == 200, after.text
    assert after.json() == []


def test_opportunity_search_filters_pagination(client):
    token = _register(client)
    headers = _headers(token)

    _create_opp(client, headers, title="Hackathon Jaipur", category="hackathon")
    _create_opp(client, headers, title="ML Research Intern", category="internship",
                skills=["ml", "python"])

    resp = client.get("/api/opportunities", params={"q": "hackathon"}, headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] >= 1
    assert body["items"][0]["title"] == "Hackathon Jaipur"

    by_category = client.get(
        "/api/opportunities", params={"category": "internship"}, headers=headers
    )
    assert by_category.status_code == 200, by_category.text
    cbody = by_category.json()
    assert cbody["total"] >= 1
    assert all(o["category"] == "internship" for o in cbody["items"])

    by_skill = client.get(
        "/api/opportunities", params={"skills": "ml"}, headers=headers
    )
    assert by_skill.status_code == 200, by_skill.text
    sbody = by_skill.json()
    assert isinstance(sbody["total"], int)
    assert isinstance(sbody["items"], list)

    page = client.get(
        "/api/opportunities",
        params={"page": 1, "page_size": 1, "sort_by": "deadline", "order": "asc"},
        headers=headers,
    )
    assert page.status_code == 200, page.text
    pbody = page.json()
    assert pbody["page"] == 1
    assert pbody["page_size"] == 1
    assert pbody["total"] == 2


def test_status_filter_and_metrics(client):
    token = _register(client)
    headers = _headers(token)

    # 1. Test metrics
    m_resp = client.get("/api/opportunities/metrics")
    assert m_resp.status_code == 200
    m_data = m_resp.json()
    assert "live_total" in m_data
    assert "expired_total" in m_data
    assert "by_category" in m_data

    # 2. Test status_filter=live
    live_resp = client.get("/api/opportunities", params={"status_filter": "live"}, headers=headers)
    assert live_resp.status_code == 200
    for item in live_resp.json()["items"]:
        if item["deadline"]:
            assert item["deadline"] >= date.today().isoformat()


def test_delete_opportunity(client):
    admin_token = _register(client, email="admin.delete@poornima.edu.in", role="admin")
    admin_headers = _headers(admin_token)
    opp = _create_opp(client, admin_headers, title="Obsolete Opportunity")
    opp_id = opp["id"]

    # Student cannot delete
    student_token = _register(client, email="student.attempt@poornima.edu.in", role="student")
    student_headers = _headers(student_token)
    forbidden_resp = client.delete(f"/api/opportunities/{opp_id}", headers=student_headers)
    assert forbidden_resp.status_code == 403

    # Admin can delete
    del_resp = client.delete(f"/api/opportunities/{opp_id}", headers=admin_headers)
    assert del_resp.status_code == 204

    get_resp = client.get(f"/api/opportunities/{opp_id}")
    assert get_resp.status_code == 404


