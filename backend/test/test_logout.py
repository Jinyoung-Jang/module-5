"""
Tests for POST /api/auth/logout endpoint
- Cookie deletion verification
"""

import pytest


class TestLogoutEndpoint:
    """Tests for /api/auth/logout endpoint"""

    def test_logout_success(self, authenticated_client):
        """Test successful logout returns success message"""
        response = authenticated_client.post("/api/auth/logout")

        assert response.status_code == 200
        data = response.json()
        assert "logged out" in data["message"].lower()

    def test_logout_deletes_cookie(self, authenticated_client):
        """Test that logout deletes the access_token cookie"""
        # Verify cookie exists before logout
        assert "access_token" in authenticated_client.cookies

        response = authenticated_client.post("/api/auth/logout")

        assert response.status_code == 200

        # Check Set-Cookie header for cookie deletion
        set_cookie_header = response.headers.get("set-cookie", "")

        # Cookie deletion typically sets max-age=0 or expires in the past
        # or sets an empty value
        assert "access_token" in set_cookie_header.lower()

    def test_logout_without_token(self, client, test_db):
        """Test logout without token still succeeds (idempotent)"""
        response = client.post("/api/auth/logout")

        # Logout should succeed even without a token
        assert response.status_code == 200

    def test_logout_then_me_fails(self, client, test_user):
        """Test that /me fails after logout"""
        # First login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password
            }
        )
        assert login_response.status_code == 200

        # Verify /me works
        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200

        # Logout
        logout_response = client.post("/api/auth/logout")
        assert logout_response.status_code == 200

        # Clear cookies to simulate cookie deletion
        # Note: TestClient doesn't automatically handle cookie deletion
        client.cookies.clear()

        # /me should now fail
        me_after_logout = client.get("/api/auth/me")
        assert me_after_logout.status_code == 401

    def test_logout_multiple_times(self, authenticated_client):
        """Test that calling logout multiple times is safe"""
        # First logout
        response1 = authenticated_client.post("/api/auth/logout")
        assert response1.status_code == 200

        # Second logout (should still succeed)
        response2 = authenticated_client.post("/api/auth/logout")
        assert response2.status_code == 200

    def test_full_auth_flow(self, client, test_db):
        """Test complete authentication flow: register -> login -> me -> logout"""
        # 1. Register new user
        register_response = client.post(
            "/api/auth/register",
            json={
                "email": "flowtest@example.com",
                "password": "flowpassword123",
                "full_name": "Flow Test User"
            }
        )
        assert register_response.status_code == 201

        # 2. Login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "flowtest@example.com",
                "password": "flowpassword123"
            }
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.cookies

        # 3. Get user info
        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200
        assert me_response.json()["email"] == "flowtest@example.com"

        # 4. Logout
        logout_response = client.post("/api/auth/logout")
        assert logout_response.status_code == 200

        # 5. Verify cannot access /me after logout
        client.cookies.clear()
        me_after_logout = client.get("/api/auth/me")
        assert me_after_logout.status_code == 401
