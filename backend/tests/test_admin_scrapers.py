from __future__ import annotations


def test_toggle_scraper_source(client):
    # Ensure sources exist first
    client.get("/api/scrapers")

    # Toggle unstop source
    res = client.patch("/api/scrapers/unstop/toggle")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["source_status"] == "disabled"

    # Toggle back
    res2 = client.patch("/api/scrapers/unstop/toggle")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["source_status"] == "active"


def test_toggle_nonexistent_source(client):
    res = client.patch("/api/scrapers/unknown_source/toggle")
    assert res.status_code == 404
