"""
Tests for User model constraints and behavior.
"""
import pytest
from sqlalchemy.exc import IntegrityError

import sys
import os

# Add backend directory to path for imports
backend_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, os.path.abspath(backend_dir))

from app.models.user import User


class TestUserModelCreation:
    """Tests for User model creation."""

    def test_create_user_success(self, test_db, sample_user_data):
        """Test successful user creation with all required fields."""
        user = User(**sample_user_data)
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.id is not None
        assert user.email == sample_user_data["email"]
        assert user.hashed_password == sample_user_data["hashed_password"]
        assert user.full_name == sample_user_data["full_name"]
        assert user.is_active == sample_user_data["is_active"]

    def test_create_user_minimal_fields(self, test_db):
        """Test user creation with only required fields."""
        user = User(
            email="minimal@example.com",
            hashed_password="password123"
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.id is not None
        assert user.email == "minimal@example.com"
        assert user.hashed_password == "password123"


class TestEmailConstraints:
    """Tests for email field constraints."""

    def test_email_unique_constraint(self, test_db, create_test_user):
        """Test that email must be unique - duplicate email should raise error."""
        # Create first user
        create_test_user(email="duplicate@example.com")

        # Try to create second user with same email
        user2 = User(
            email="duplicate@example.com",
            hashed_password="another_password"
        )
        test_db.add(user2)

        with pytest.raises(IntegrityError):
            test_db.commit()

    def test_email_not_null_constraint(self, test_db):
        """Test that email cannot be null."""
        user = User(
            email=None,
            hashed_password="password123"
        )
        test_db.add(user)

        with pytest.raises(IntegrityError):
            test_db.commit()


class TestHashedPasswordConstraints:
    """Tests for hashed_password field constraints."""

    def test_hashed_password_not_null_constraint(self, test_db):
        """Test that hashed_password cannot be null."""
        user = User(
            email="test@example.com",
            hashed_password=None
        )
        test_db.add(user)

        with pytest.raises(IntegrityError):
            test_db.commit()


class TestTimestampFields:
    """Tests for created_at and updated_at automatic fields."""

    def test_created_at_auto_generated(self, test_db):
        """Test that created_at is automatically set on creation."""
        user = User(
            email="timestamp@example.com",
            hashed_password="password123"
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.created_at is not None

    def test_updated_at_initially_none(self, test_db):
        """Test that updated_at is None on initial creation."""
        user = User(
            email="timestamp2@example.com",
            hashed_password="password123"
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        # updated_at is None initially (only set on update)
        assert user.updated_at is None

    def test_updated_at_set_on_update(self, test_db):
        """Test that updated_at is set when user is modified."""
        user = User(
            email="timestamp3@example.com",
            hashed_password="password123"
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        initial_updated_at = user.updated_at

        # Update the user
        user.full_name = "Updated Name"
        test_db.commit()
        test_db.refresh(user)

        # updated_at should now be set
        assert user.updated_at is not None
        assert user.updated_at != initial_updated_at


class TestIsActiveDefault:
    """Tests for is_active field default value."""

    def test_is_active_default_true(self, test_db):
        """Test that is_active defaults to True when not specified."""
        user = User(
            email="active@example.com",
            hashed_password="password123"
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.is_active is True

    def test_is_active_can_be_set_false(self, test_db):
        """Test that is_active can be explicitly set to False."""
        user = User(
            email="inactive@example.com",
            hashed_password="password123",
            is_active=False
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.is_active is False


class TestFullNameField:
    """Tests for full_name field (nullable)."""

    def test_full_name_nullable(self, test_db):
        """Test that full_name can be null."""
        user = User(
            email="noname@example.com",
            hashed_password="password123",
            full_name=None
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.full_name is None

    def test_full_name_can_be_set(self, test_db):
        """Test that full_name can be set to a value."""
        user = User(
            email="named@example.com",
            hashed_password="password123",
            full_name="John Doe"
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)

        assert user.full_name == "John Doe"
