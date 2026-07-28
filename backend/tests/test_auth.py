def test_register_and_receive_token(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Auth Test", "email": "auth.test@deepshield.ai", "password": "AuthTest123"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["email"] == "auth.test@deepshield.ai"
    assert body["accessToken"]
    assert body["tokenType"] == "bearer"


def test_register_duplicate_email_rejected(client):
    payload = {"name": "Dup", "email": "dup.test@deepshield.ai", "password": "DupTest123"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 409


def test_register_weak_password_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Weak", "email": "weak.test@deepshield.ai", "password": "short"},
    )
    assert response.status_code == 422


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/auth/register",
        json={"name": "Login Test", "email": "login.test@deepshield.ai", "password": "LoginTest123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "login.test@deepshield.ai", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "pytest.user@deepshield.ai"


def test_logout_requires_authentication(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 401
