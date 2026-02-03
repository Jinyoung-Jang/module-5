"""
Pytest fixtures for database testing.
Uses in-memory SQLite for isolation and speed.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
import os

# Add backend directory to path for imports
backend_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, os.path.abspath(backend_dir))

from app.database import Base
from app.models.user import User


# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_engine():
    """Create a test database engine with in-memory SQLite."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_db(test_engine):
    """
    Create a test database session.
    Each test gets a fresh session with clean database.
    """
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    session = TestingSessionLocal()

    yield session

    session.rollback()
    session.close()


@pytest.fixture(scope="function")
def clean_db(test_db):
    """
    Fixture that ensures database is clean after each test.
    Deletes all data from tables while keeping schema.
    """
    yield test_db

    # Clean up all tables after test
    for table in reversed(Base.metadata.sorted_tables):
        test_db.execute(table.delete())
    test_db.commit()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "hashed_password": "hashed_password_123",
        "full_name": "Test User",
        "is_active": True,
    }


@pytest.fixture
def create_test_user(test_db, sample_user_data):
    """Factory fixture to create test users."""
    def _create_user(
        email=None,
        hashed_password=None,
        full_name=None,
        is_active=True
    ):
        user = User(
            email=email or sample_user_data["email"],
            hashed_password=hashed_password or sample_user_data["hashed_password"],
            full_name=full_name or sample_user_data["full_name"],
            is_active=is_active,
        )
        test_db.add(user)
        test_db.commit()
        test_db.refresh(user)
        return user

    return _create_user
