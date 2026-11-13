def _register(client, email="student@poornima.edu.in", name="Bhavya", password="secret123"):
    return client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_and_me(client):
    resp = _register(client)
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    assert isinstance(token, str) and token

    me = client.get("/api/auth/me", headers=_auth(token))
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "student@poornima.edu.in"
    assert body["name"] == "Bhavya"
    assert body["skills"] == []


def test_register_duplicate_email(client):
    assert _register(client).status_code == 201
    assert _register(client).status_code == 409


def test_register_short_password(client):
    resp = _register(client, password="123")
    assert resp.status_code == 422


def test_register_invalid_email(client):
    resp = _register(client, email="not-an-email")
    assert resp.status_code == 422


def test_login_success(client):
    _register(client)
    resp = client.post(
        "/api/auth/login",
        json={"email": "student@poornima.edu.in", "password": "secret123"},
    )
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"


def test_login_wrong_password(client):
    _register(client)
    resp = client.post(
        "/api/auth/login",
        json={"email": "student@poornima.edu.in", "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_me_without_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_invalid_token(client):
    resp = client.get("/api/auth/me", headers=_auth("garbage-token"))
    assert resp.status_code == 401


def test_update_profile(client):
    resp = _register(client, email="bhavya.update@poornima.edu.in")
    assert resp.status_code == 201
    token = resp.json()["access_token"]

    update_resp = client.patch(
        "/api/auth/me",
        headers=_auth(token),
        json={
            "domain": "Artificial Intelligence",
            "skills": ["python", "pytorch", "fastapi"],
            "education": "B.Tech CSE - Poornima University",
            "preferred_role": "Machine Learning Engineer",
            "location": "Jaipur",
            "remote_preference": True,
        },
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["domain"] == "Artificial Intelligence"
    assert data["skills"] == ["python", "pytorch", "fastapi"]
    assert data["education"] == "B.Tech CSE - Poornima University"
    assert data["preferred_role"] == "Machine Learning Engineer"
    assert data["location"] == "Jaipur"
    assert data["remote_preference"] is True