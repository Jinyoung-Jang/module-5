"""
Tests for User CRUD operations.
"""
import pytest

import sys
import os

# Add backend directory to path for imports
backend_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, os.path.abspath(backend_dir))

from app.models.user import User


# CRUD helper functions for testing
# These would normally be in backend/app/crud/user.py

def create_user(db, email: str, hashed_password: str, full_name: str = None, is_active: bool = True) -> User:
    """Create a new user."""
    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db, user_id: int) -> User | None:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db, email: str) -> User | None:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_users(db, skip: int = 0, limit: int = 100) -> list[User]:
    """Get list of users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


class TestCreateUser:
    """Tests for user creation."""

    def test_create_user_success(self, test_db):
        """Test successful user creation."""
        user = create_user(
            db=test_db,
            email="newuser@example.com",
            hashed_password="hashed_password_123",
            full_name="New User"
        )

        assert user.id is not None
        assert user.email == "newuser@example.com"
        assert user.hashed_password == "hashed_password_123"
        assert user.full_name == "New User"
        assert user.is_active is True

    def test_create_user_with_minimal_data(self, test_db):
        """Test user creation with only required fields."""
        user = create_user(
            db=test_db,
            email="minimal@example.com",
            hashed_password="password123"
        )

        assert user.id is not None
        assert user.email == "minimal@example.com"
        assert user.full_name is None
        assert user.is_active is True

    def test_create_inactive_user(self, test_db):
        """Test creating a user with is_active=False."""
        user = create_user(
            db=test_db,
            email="inactive@example.com",
            hashed_password="password123",
            is_active=False
        )

        assert user.is_active is False


class TestGetUserByEmail:
    """Tests for getting user by email."""

    def test_get_user_by_email_found(self, test_db, create_test_user):
        """Test getting existing user by email."""
        created_user = create_test_user(email="findme@example.com")

        found_user = get_user_by_email(test_db, "findme@example.com")

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "findme@example.com"

    def test_get_user_by_email_not_found(self, test_db):
        """Test getting non-existent user by email returns None."""
        found_user = get_user_by_email(test_db, "nonexistent@example.com")

        assert found_user is None

    def test_get_user_by_email_case_sensitive(self, test_db, create_test_user):
        """Test that email search is case-sensitive (SQLite default)."""
        create_test_user(email="CaseSensitive@example.com")

        # Exact match should work
        found_exact = get_user_by_email(test_db, "CaseSensitive@example.com")
        assert found_exact is not None

        # Different case should not find (SQLite LIKE is case-insensitive, but = is case-sensitive)
        found_different = get_user_by_email(test_db, "casesensitive@example.com")
        assert found_different is None


class TestGetUserById:
    """Tests for getting user by ID."""

    def test_get_user_by_id_found(self, test_db, create_test_user):
        """Test getting existing user by ID."""
        created_user = create_test_user(email="byid@example.com")

        found_user = get_user_by_id(test_db, created_user.id)

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "byid@example.com"

    def test_get_user_by_id_not_found(self, test_db):
        """Test getting non-existent user by ID returns None."""
        found_user = get_user_by_id(test_db, 99999)

        assert found_user is None

    def test_get_user_by_id_zero(self, test_db):
        """Test getting user with ID 0 returns None."""
        found_user = get_user_by_id(test_db, 0)

        assert found_user is None

    def test_get_user_by_id_negative(self, test_db):
        """Test getting user with negative ID returns None."""
        found_user = get_user_by_id(test_db, -1)

        assert found_user is None


class TestGetUsers:
    """Tests for getting list of users."""

    def test_get_users_empty(self, test_db):
        """Test getting users when no users exist."""
        users = get_users(test_db)

        assert users == []

    def test_get_users_returns_all(self, test_db, create_test_user):
        """Test getting all users."""
        create_test_user(email="user1@example.com")
        create_test_user(email="user2@example.com")
        create_test_user(email="user3@example.com")

        users = get_users(test_db)

        assert len(users) == 3

    def test_get_users_with_pagination(self, test_db, create_test_user):
        """Test getting users with skip and limit."""
        for i in range(5):
            create_test_user(email=f"user{i}@example.com")

        # Get first 2 users
        first_page = get_users(test_db, skip=0, limit=2)
        assert len(first_page) == 2

        # Get next 2 users
        second_page = get_users(test_db, skip=2, limit=2)
        assert len(second_page) == 2

        # Get last user
        third_page = get_users(test_db, skip=4, limit=2)
        assert len(third_page) == 1

    def test_get_users_skip_all(self, test_db, create_test_user):
        """Test that skipping all users returns empty list."""
        create_test_user(email="user@example.com")

        users = get_users(test_db, skip=100)

        assert users == []


class TestUserNotFound:
    """Tests for handling non-existent users."""

    def test_get_nonexistent_user_by_id_returns_none(self, test_db):
        """Test that querying non-existent ID returns None, not error."""
        result = get_user_by_id(test_db, 12345)
        assert result is None

    def test_get_nonexistent_user_by_email_returns_none(self, test_db):
        """Test that querying non-existent email returns None, not error."""
        result = get_user_by_email(test_db, "does.not.exist@example.com")
        assert result is None
