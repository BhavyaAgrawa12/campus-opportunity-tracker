from __future__ import annotations
from uuid import uuid4


def _register(client, role="admin"):
    email = f"user.{uuid4().hex[:8]}@learn-poornima.in"
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Admin User",
            "email": email,
            "password": "secret123!",
            "role": role,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_toggle_scraper_source(client):
    # Ensure sources exist first
    client.get("/api/scrapers")

    # Unauthenticated should be rejected
    res_unauth = client.patch("/api/scrapers/unstop/toggle")
    assert res_unauth.status_code == 401

    # Student role should be forbidden
    student_token = _register(client, role="student")
    res_student = client.patch(
        "/api/scrapers/unstop/toggle", headers=_headers(student_token)
    )
    assert res_student.status_code == 403

    # Admin role succeeds
    admin_token = _register(client, role="admin")
    admin_headers = _headers(admin_token)

    res = client.patch("/api/scrapers/unstop/toggle", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["source_status"] == "disabled"

    # Toggle back
    res2 = client.patch("/api/scrapers/unstop/toggle", headers=admin_headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["source_status"] == "active"


def test_toggle_nonexistent_source(client):
    admin_token = _register(client, role="admin")
    res = client.patch(
        "/api/scrapers/unknown_source/toggle", headers=_headers(admin_token)
    )
    assert res.status_code == 404
