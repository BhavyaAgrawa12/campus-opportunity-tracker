from __future__ import annotations

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
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_email_api_demo_sync(client):
    res = client.post("/api/email/sync-demo")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "data" in data
    assert data["data"]["records_found"] == 3
    assert data["data"]["records_added"] >= 1

    # Second sync should deduplicate
    res2 = client.post("/api/email/sync-demo")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["data"]["duplicates"] >= 3


def test_email_api_ingest_raw(client):
    payload = {
        "subject": "Campus Hackathon 2026",
        "body": "Join the annual Poornima Hackathon. Last date to apply: 2026-11-10. Register at https://unstop.com/hackathons/poornima-2026. Skills: python, react",
        "sender": "TPO Cell",
    }
    res = client.post("/api/email/ingest-raw", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["draft"]["category"] == "hackathon"
    assert "https://unstop.com/hackathons/poornima-2026" in data["draft"]["application_url"]


def test_email_account_management(client):
    token = _register(client)
    headers = _headers(token)

    # Create email account
    payload = {
        "email": "2023csbhavya14015@poornima.edu.in",
        "provider": "gmail",
        "imap_server": "imap.gmail.com",
        "imap_port": 993,
        "username": "2023csbhavya14015@poornima.edu.in",
        "password": "sample-secret-app-password",
        "mailbox_folder": "INBOX",
    }
    res = client.post("/api/email/accounts", json=payload, headers=headers)
    assert res.status_code == 201
    acc = res.json()
    assert acc["email"] == "2023csbhavya14015@poornima.edu.in"
    account_id = acc["id"]

    # List email accounts
    list_res = client.get("/api/email/accounts", headers=headers)
    assert list_res.status_code == 200
    accounts = list_res.json()
    assert len(accounts) >= 1
    assert any(a["id"] == account_id for a in accounts)

    # Delete email account
    del_res = client.delete(f"/api/email/accounts/{account_id}", headers=headers)
    assert del_res.status_code == 204
