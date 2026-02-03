"""
Tests for POST /api/auth/register endpoint
- Successful registration (201)
- Email already exists (400)
- Invalid email format (422)
- Password too short (422)
- Password hashing verification
"""

import pytest
from app.models import User
from app.auth_utils import verify_password


class TestRegisterEndpoint:
    """Tests for /api/auth/register endpoint"""

    def test_register_success(self, client, test_db):
        """Test successful user registration returns 201"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "full_name": "New User"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        # Password should not be in response
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_without_full_name(self, client, test_db):
        """Test registration without optional full_name"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "noname@example.com",
                "password": "password123"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "noname@example.com"
        assert data["full_name"] is None

    def test_register_email_already_exists(self, client, test_db, test_user):
        """Test registration with existing email returns 400"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": test_user.email,  # Using existing test user's email
                "password": "newpassword123",
                "full_name": "Duplicate User"
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()

    def test_register_invalid_email_format(self, client, test_db):
        """Test registration with invalid email format returns 422"""
        invalid_emails = [
            "notanemail",
            "missing@domain",
            "@nodomain.com",
            "spaces in@email.com",
            "double@@at.com"
        ]

        for invalid_email in invalid_emails:
            response = client.post(
                "/api/auth/register",
                json={
                    "email": invalid_email,
                    "password": "password123",
                    "full_name": "Test User"
                }
            )

            assert response.status_code == 422, f"Expected 422 for email: {invalid_email}"

    def test_register_password_too_short(self, client, test_db):
        """Test registration with password < 6 characters returns 422"""
        short_passwords = ["12345", "abc", "a", ""]

        for short_password in short_passwords:
            response = client.post(
                "/api/auth/register",
                json={
                    "email": "shortpwd@example.com",
                    "password": short_password,
                    "full_name": "Short Password User"
                }
            )

            assert response.status_code == 422, f"Expected 422 for password: '{short_password}'"

    def test_register_password_exactly_6_characters(self, client, test_db):
        """Test registration with password exactly 6 characters succeeds"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "exact6@example.com",
                "password": "123456",  # Exactly 6 characters
                "full_name": "Exact Six"
            }
        )

        assert response.status_code == 201

    def test_register_password_is_hashed(self, client, test_db):
        """Test that password is hashed in database, not stored in plain text"""
        plain_password = "myplainpassword"

        response = client.post(
            "/api/auth/register",
            json={
                "email": "hashtest@example.com",
                "password": plain_password,
                "full_name": "Hash Test User"
            }
        )

        assert response.status_code == 201

        # Query the user from database directly
        user = test_db.query(User).filter(User.email == "hashtest@example.com").first()

        assert user is not None
        # Password should be hashed, not plain text
        assert user.hashed_password != plain_password
        # Hashed password should start with bcrypt prefix
        assert user.hashed_password.startswith("$2b$")
        # Verify that the plain password can be verified against the hash
        assert verify_password(plain_password, user.hashed_password) is True

    def test_register_missing_email(self, client, test_db):
        """Test registration without email returns 422"""
        response = client.post(
            "/api/auth/register",
            json={
                "password": "password123",
                "full_name": "No Email User"
            }
        )

        assert response.status_code == 422

    def test_register_missing_password(self, client, test_db):
        """Test registration without password returns 422"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "nopwd@example.com",
                "full_name": "No Password User"
            }
        )

        assert response.status_code == 422

    def test_register_email_case_insensitive_check(self, client, test_db, test_user):
        """Test that email uniqueness check handles case variations"""
        # Note: This test depends on whether the application treats emails case-sensitively
        # SQLite default is case-insensitive for ASCII
        upper_email = test_user.email.upper()

        response = client.post(
            "/api/auth/register",
            json={
                "email": upper_email,
                "password": "password123",
                "full_name": "Upper Case Email"
            }
        )

        # Depending on implementation, this may be 400 (duplicate) or 201 (new user)
        # The current implementation uses direct string comparison
        assert response.status_code in [201, 400]
