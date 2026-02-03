"""
인증 및 권한 의존성 모듈
- httpOnly cookie에서 JWT 토큰 추출
- 현재 사용자 조회
- 관리자 권한 확인
- 게시물 접근 권한 확인
"""

from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.auth_utils import decode_access_token
from app.models import User, Post, PostPermission


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


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    관리자 권한 확인

    Args:
        current_user: 현재 로그인한 사용자

    Returns:
        관리자 권한을 가진 User 객체

    Raises:
        HTTPException: 관리자가 아닌 경우 403 에러
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def check_post_access(
    post_id: int,
    db: Session,
    current_user: User
) -> Post:
    """
    게시물 접근 권한 확인

    Args:
        post_id: 게시물 ID
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자

    Returns:
        접근 가능한 Post 객체

    Raises:
        HTTPException:
            - 게시물이 없는 경우 404 에러
            - 권한이 없는 경우 403 에러
    """
    # 1. 게시물 존재 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # 2. 관리자면 항상 허용
    if current_user.is_admin:
        return post

    # 3. 작성자면 허용
    if post.author_id == current_user.id:
        return post

    # 4. is_public이면 허용
    if post.is_public:
        return post

    # 5. PostPermission에서 권한 확인
    permission = db.query(PostPermission).filter(
        PostPermission.post_id == post_id,
        PostPermission.user_id == current_user.id
    ).first()

    if permission:
        return post

    # 권한 없음
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied"
    )
