"""
Permissions API 라우터
- 게시물 권한 관리 (조회, 추가, 삭제)
- 게시물 작성자 또는 관리자만 권한 관리 가능
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Post, PostPermission
from app.schemas import PermissionCreate, PermissionResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/posts/{post_id}/permissions", tags=["permissions"])


def check_permission_management_access(
    post_id: int,
    db: Session,
    current_user: User
) -> Post:
    """
    권한 관리 접근 권한 확인
    - 게시물 작성자 또는 관리자만 권한 관리 가능

    Args:
        post_id: 게시물 ID
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자

    Returns:
        Post 객체

    Raises:
        HTTPException:
            - 게시물이 없는 경우 404 에러
            - 권한이 없는 경우 403 에러
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # 작성자 또는 관리자만 권한 관리 가능
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage permissions for this post"
        )

    return post


@router.get("/", response_model=List[PermissionResponse])
def get_permissions(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    해당 게시물의 권한 목록 조회

    - 게시물 작성자 또는 관리자만 조회 가능
    """
    check_permission_management_access(post_id, db, current_user)

    permissions = db.query(PostPermission).filter(
        PostPermission.post_id == post_id
    ).all()

    return permissions


@router.post("/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(
    post_id: int,
    permission_data: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물에 권한 추가

    - 게시물 작성자 또는 관리자만 권한 추가 가능
    - user_id 또는 user_identifier(이메일)로 사용자 지정 가능
    - 이미 존재하는 권한이면 409 Conflict
    """
    check_permission_management_access(post_id, db, current_user)

    # 대상 사용자 찾기 (user_id 또는 user_identifier로)
    target_user = None
    if permission_data.user_id:
        target_user = db.query(User).filter(User.id == permission_data.user_id).first()
    elif permission_data.user_identifier:
        target_user = db.query(User).filter(User.email == permission_data.user_identifier).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 이미 존재하는 권한인지 확인
    existing_permission = db.query(PostPermission).filter(
        PostPermission.post_id == post_id,
        PostPermission.user_id == target_user.id
    ).first()

    if existing_permission:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists for this user"
        )

    # 권한 생성
    new_permission = PostPermission(
        post_id=post_id,
        user_id=target_user.id,
        permission_type=permission_data.permission_type
    )

    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)

    return new_permission


@router.delete("/{user_id}")
def delete_permission(
    post_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물의 특정 사용자 권한 삭제

    - 게시물 작성자 또는 관리자만 권한 삭제 가능
    - 존재하지 않는 권한이면 404 Not Found
    """
    check_permission_management_access(post_id, db, current_user)

    # 권한 조회
    permission = db.query(PostPermission).filter(
        PostPermission.post_id == post_id,
        PostPermission.user_id == user_id
    ).first()

    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )

    db.delete(permission)
    db.commit()

    return {"message": "Permission deleted successfully"}
