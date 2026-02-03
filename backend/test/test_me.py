"""
Tests for GET /api/auth/me endpoint
- Successful user info retrieval
- No token provided (401)
- Invalid token (401)
"""

import pytest
from datetime import timedelta

from app.auth_utils import create_access_token


class TestMeEndpoint:
    """Tests for /api/auth/me endpoint"""

    def test_me_success(self, authenticated_client, test_user):
        """Test successful user info retrieval"""
        response = authenticated_client.get("/api/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["is_active"] == test_user.is_active
        assert "created_at" in data
        # Sensitive data should not be exposed
        assert "hashed_password" not in data
        assert "password" not in data

    def test_me_without_token(self, client, test_db):
        """Test /me without token returns 401"""
        response = client.get("/api/auth/me")

        assert response.status_code == 401
        data = response.json()
        assert "could not validate" in data["detail"].lower()

    def test_me_invalid_token(self, client, test_db):
        """Test /me with invalid token returns 401"""
        # Set an invalid token in cookies
        client.cookies.set("access_token", "invalid.token.here")

        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_me_expired_token(self, client, test_user, test_db):
        """Test /me with expired token returns 401"""
        # Create an expired token
        expired_token = create_access_token(
            data={"sub": str(test_user.id), "email": test_user.email},
            expires_delta=timedelta(seconds=-10)  # Already expired
        )

        client.cookies.set("access_token", expired_token)

        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_me_tampered_token(self, client, test_user, test_db):
        """Test /me with tampered token returns 401"""
        # Create a valid token and tamper with it
        valid_token = create_access_token(
            data={"sub": str(test_user.id), "email": test_user.email}
        )

        # Tamper with the token
        parts = valid_token.split(".")
        parts[1] = parts[1] + "tampered"
        tampered_token = ".".join(parts)

        client.cookies.set("access_token", tampered_token)

        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_me_token_without_sub_claim(self, client, test_db):
        """Test /me with token missing 'sub' claim returns 401"""
        # Create token without 'sub' claim
        token_without_sub = create_access_token(
            data={"email": "test@example.com"}  # Missing 'sub'
        )

        client.cookies.set("access_token", token_without_sub)

        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_me_token_with_nonexistent_user_id(self, client, test_db):
        """Test /me with token for non-existent user returns 401"""
        # Create token for a user ID that doesn't exist
        token_for_nonexistent = create_access_token(
            data={"sub": "99999", "email": "nonexistent@example.com"}
        )

        client.cookies.set("access_token", token_for_nonexistent)

        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_me_empty_token(self, client, test_db):
        """Test /me with empty token returns 401"""
        client.cookies.set("access_token", "")

        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_me_after_login_flow(self, client, test_user):
        """Test /me works correctly after login flow"""
        # First, login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": test_user.plain_password
            }
        )

        assert login_response.status_code == 200

        # The cookie should be automatically set, now call /me
        me_response = client.get("/api/auth/me")

        assert me_response.status_code == 200
        data = me_response.json()
        assert data["email"] == test_user.email
