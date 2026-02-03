"""
pytest fixtures for backend tests
- TestClient with in-memory SQLite database
- Test user creation fixture
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import User
from app.auth_utils import hash_password, create_access_token


# In-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Test database session dependency override"""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def test_db():
    """
    Create test database tables before each test,
    and drop them after the test completes.
    """
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(test_db):
    """
    FastAPI TestClient fixture.
    Depends on test_db to ensure database is set up.
    """
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def test_user(test_db):
    """
    Create a test user in the database.
    Returns the user object with plain password for testing.
    """
    plain_password = "testpassword123"
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password(plain_password),
        full_name="Test User",
        is_active=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    # Attach plain password for use in tests
    user.plain_password = plain_password
    return user


@pytest.fixture(scope="function")
def auth_token(test_user):
    """
    Create a valid JWT token for the test user.
    """
    return create_access_token(
        data={"sub": str(test_user.id), "email": test_user.email}
    )


@pytest.fixture(scope="function")
def authenticated_client(client, auth_token):
    """
    TestClient with authentication cookie set.
    """
    client.cookies.set("access_token", auth_token)
    return client
