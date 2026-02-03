"""
인증 의존성 모듈
- httpOnly cookie에서 JWT 토큰 추출
- 현재 사용자 조회
"""

from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.auth_utils import decode_access_token
from app.models import User


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
) -> User:
    """
    httpOnly cookie에서 JWT 토큰을 추출하여 현재 사용자를 조회합니다.

    Args:
        access_token: Cookie에서 추출한 JWT 토큰
        db: 데이터베이스 세션

    Returns:
        현재 로그인한 User 객체

    Raises:
        HTTPException: 토큰이 없거나 유효하지 않은 경우 401 에러
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 토큰이 없는 경우
    if access_token is None:
        raise credentials_exception

    try:
        # JWT 토큰 디코드
        payload = decode_access_token(access_token)
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # DB에서 사용자 조회
    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise credentials_exception

    return user
