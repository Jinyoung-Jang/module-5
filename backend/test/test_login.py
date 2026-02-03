"""
Tests for POST /api/auth/login endpoint
- Successful login (200)
- httpOnly cookie verification
- Email not found (401)
- Wrong password (401)
"""

import pytest


class TestLoginEndpoint:
    """Tests for /api/auth/login endpoint"""

    def test_login_success(self, client, test_user):
        """Test successful login returns 200 with token"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_login_sets_httponly_cookie(self, client, test_user):
        """Test that login sets httpOnly cookie with access_token"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password
            }
        )

        assert response.status_code == 200

        # Check that access_token cookie is set
        assert "access_token" in response.cookies

        # Verify cookie value matches response body token
        data = response.json()
        assert response.cookies["access_token"] == data["access_token"]

    def test_login_cookie_attributes(self, client, test_user):
        """Test httpOnly cookie has correct security attributes"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password
            }
        )

        assert response.status_code == 200

        # Get the Set-Cookie header
        set_cookie_header = response.headers.get("set-cookie", "").lower()

        # Verify httponly flag is set
        assert "httponly" in set_cookie_header

        # Verify samesite is set
        assert "samesite" in set_cookie_header

    def test_login_email_not_found(self, client, test_db):
        """Test login with non-existent email returns 401"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "anypassword"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()

    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password returns 401"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword"
            }
        )

        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()

    def test_login_empty_password(self, client, test_user):
        """Test login with empty password returns 401"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": ""
            }
        )

        assert response.status_code == 401

    def test_login_invalid_email_format(self, client, test_db):
        """Test login with invalid email format returns 422"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "notanemail",
                "password": "password123"
            }
        )

        assert response.status_code == 422

    def test_login_missing_email(self, client, test_db):
        """Test login without email returns 422"""
        response = client.post(
            "/api/auth/login",
            json={
                "password": "password123"
            }
        )

        assert response.status_code == 422

    def test_login_missing_password(self, client, test_db):
        """Test login without password returns 422"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com"
            }
        )

        assert response.status_code == 422

    def test_login_case_sensitive_password(self, client, test_user):
        """Test that password verification is case-sensitive"""
        # Try with different case
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password.upper()
            }
        )

        # Should fail because password is case-sensitive
        assert response.status_code == 401

    def test_login_token_format(self, client, test_user):
        """Test that returned token is a valid JWT format"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password
            }
        )

        assert response.status_code == 200
        data = response.json()

        # JWT tokens have 3 parts separated by dots
        token_parts = data["access_token"].split(".")
        assert len(token_parts) == 3
