from tests.conftest import register


def test_register_login_and_me(client):
    """A new user can register, is returned in camelCase, and can log in and fetch themselves."""
    res = client.post(
        "/api/auth/register",
        json={"firstName": "Dana", "lastName": "Cohen", "email": "Dana@Example.com", "password": "password123"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["firstName"] == "Dana"
    assert body["user"]["email"] == "dana@example.com"
    assert body["user"]["familyId"] is None

    login = client.post("/api/auth/login", json={"email": "dana@example.com", "password": "password123"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['token']}"}
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["lastName"] == "Cohen"


def test_duplicate_email_and_bad_password(client):
    """Duplicate emails are rejected with a code the frontend can translate; wrong passwords give 401."""
    register(client, "a@example.com")
    dup = client.post(
        "/api/auth/register",
        json={"firstName": "A", "lastName": "B", "email": "a@example.com", "password": "password123"},
    )
    assert dup.status_code == 409
    assert dup.json() == {"message": "An account with this email already exists", "code": "email_taken"}

    bad = client.post("/api/auth/login", json={"email": "a@example.com", "password": "nope-nope"})
    assert bad.status_code == 401
    assert bad.json()["code"] == "invalid_credentials"


def test_me_requires_token(client):
    """Protected routes return 401 without a bearer token."""
    assert client.get("/api/auth/me").status_code == 401


def test_update_profile(client):
    """PUT /auth/me updates the name."""
    headers = register(client, "p@example.com")
    res = client.put("/api/auth/me", json={"firstName": "New", "lastName": "Name"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["firstName"] == "New"


def test_password_reset_flow(client):
    """In development the reset token is returned, and using it changes the password once."""
    register(client, "r@example.com")
    res = client.post("/api/auth/forgot-password", json={"email": "r@example.com"})
    assert res.status_code == 200
    token = res.json()["resetToken"]
    assert token

    # Unknown emails get the same 200 without a token.
    assert client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"}).json()["resetToken"] is None

    ok = client.post("/api/auth/reset-password", json={"token": token, "password": "newpassword9"})
    assert ok.status_code == 204
    assert client.post("/api/auth/login", json={"email": "r@example.com", "password": "newpassword9"}).status_code == 200

    reused = client.post("/api/auth/reset-password", json={"token": token, "password": "another123"})
    assert reused.status_code == 400
    assert reused.json()["code"] == "invalid_token"
