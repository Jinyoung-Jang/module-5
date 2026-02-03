"""
Tests for authentication utility functions
- hash_password
- verify_password
- create_access_token
- decode_access_token
"""

import pytest
from datetime import timedelta
from jose import JWTError

from app.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


class TestHashPassword:
    """hash_password function tests"""

    def test_hash_password_returns_hashed_string(self):
        """Test that hash_password returns a bcrypt hash string"""
        plain_password = "mypassword123"
        hashed = hash_password(plain_password)

        assert hashed is not None
        assert isinstance(hashed, str)
        assert hashed != plain_password
        # bcrypt hashes start with $2b$
        assert hashed.startswith("$2b$")

    def test_hash_password_different_hashes_for_same_password(self):
        """Test that hashing same password twice produces different hashes (due to salt)"""
        plain_password = "mypassword123"
        hash1 = hash_password(plain_password)
        hash2 = hash_password(plain_password)

        assert hash1 != hash2

    def test_hash_password_empty_string(self):
        """Test hashing an empty string"""
        hashed = hash_password("")
        assert hashed is not None
        assert hashed.startswith("$2b$")


class TestVerifyPassword:
    """verify_password function tests"""

    def test_verify_password_correct_password(self):
        """Test that verify_password returns True for correct password"""
        plain_password = "correctpassword"
        hashed = hash_password(plain_password)

        assert verify_password(plain_password, hashed) is True

    def test_verify_password_wrong_password(self):
        """Test that verify_password returns False for wrong password"""
        plain_password = "correctpassword"
        wrong_password = "wrongpassword"
        hashed = hash_password(plain_password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty_string(self):
        """Test verification with empty password"""
        plain_password = ""
        hashed = hash_password(plain_password)

        assert verify_password("", hashed) is True
        assert verify_password("notempty", hashed) is False

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive"""
        plain_password = "Password123"
        hashed = hash_password(plain_password)

        assert verify_password("Password123", hashed) is True
        assert verify_password("password123", hashed) is False
        assert verify_password("PASSWORD123", hashed) is False


class TestCreateAccessToken:
    """create_access_token function tests"""

    def test_create_access_token_returns_string(self):
        """Test that create_access_token returns a JWT string"""
        data = {"sub": "123", "email": "test@example.com"}
        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        # JWT tokens have 3 parts separated by dots
        assert len(token.split(".")) == 3

    def test_create_access_token_with_custom_expiry(self):
        """Test creating token with custom expiration delta"""
        data = {"sub": "123"}
        expires = timedelta(hours=1)
        token = create_access_token(data, expires_delta=expires)

        assert token is not None
        # Decode and verify expiration is set
        payload = decode_access_token(token)
        assert "exp" in payload

    def test_create_access_token_contains_payload_data(self):
        """Test that token contains the provided payload data"""
        data = {"sub": "user123", "email": "test@example.com", "custom_field": "value"}
        token = create_access_token(data)

        payload = decode_access_token(token)
        assert payload["sub"] == "user123"
        assert payload["email"] == "test@example.com"
        assert payload["custom_field"] == "value"

    def test_create_access_token_adds_exp_claim(self):
        """Test that exp claim is automatically added"""
        data = {"sub": "123"}
        token = create_access_token(data)

        payload = decode_access_token(token)
        assert "exp" in payload


class TestDecodeAccessToken:
    """decode_access_token function tests"""

    def test_decode_access_token_valid_token(self):
        """Test decoding a valid token"""
        data = {"sub": "456", "email": "decode@test.com"}
        token = create_access_token(data)

        payload = decode_access_token(token)

        assert payload["sub"] == "456"
        assert payload["email"] == "decode@test.com"

    def test_decode_access_token_invalid_token(self):
        """Test that decoding invalid token raises JWTError"""
        invalid_token = "invalid.token.string"

        with pytest.raises(JWTError):
            decode_access_token(invalid_token)

    def test_decode_access_token_tampered_token(self):
        """Test that decoding tampered token raises JWTError"""
        data = {"sub": "123"}
        token = create_access_token(data)

        # Tamper with the token by modifying the payload part
        parts = token.split(".")
        parts[1] = parts[1] + "tampered"
        tampered_token = ".".join(parts)

        with pytest.raises(JWTError):
            decode_access_token(tampered_token)

    def test_decode_access_token_empty_string(self):
        """Test that decoding empty string raises JWTError"""
        with pytest.raises(JWTError):
            decode_access_token("")

    def test_decode_access_token_expired_token(self):
        """Test that decoding expired token raises JWTError"""
        data = {"sub": "123"}
        # Create token that expires immediately (negative time)
        token = create_access_token(data, expires_delta=timedelta(seconds=-10))

        with pytest.raises(JWTError):
            decode_access_token(token)
