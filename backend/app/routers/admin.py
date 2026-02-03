"""
Admin API 라우터
- 관리자 전용 사용자 관리
- 관리자 전용 게시물 관리
"""

import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Post, PostPermission
from app.schemas import UserResponse, UserAdminUpdate, PostListResponse
from app.dependencies import get_current_admin
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ==================== 통계 ====================

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    관리자 대시보드 통계 조회
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_posts = db.query(Post).count()
    public_posts = db.query(Post).filter(Post.is_public == True).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_posts": total_posts,
        "public_posts": public_posts
    }


# ==================== 사용자 관리 ====================

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    전체 사용자 목록 조회 (관리자 전용)
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    사용자 상세 정보 조회 (관리자 전용)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    사용자 정보 수정 (관리자 전용)

    - 자기 자신의 관리자 권한은 삭제하지 못하도록 방지
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 자기 자신의 관리자 권한 삭제 방지
    if user_id == current_admin.id and user_data.is_admin is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin privileges"
        )

    # 이메일 중복 확인 (변경하려는 경우)
    if user_data.email is not None and user_data.email != user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

    # 수정할 필드만 업데이트
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    사용자 삭제 (관리자 전용)

    - 자기 자신은 삭제할 수 없음
    - 해당 사용자의 게시물, 비디오 파일, 권한도 함께 삭제
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # 자기 자신 삭제 방지
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # 해당 사용자에게 부여된 권한 삭제 (다른 사용자 게시물에 대한 권한)
    db.query(PostPermission).filter(PostPermission.user_id == user_id).delete()

    # 해당 사용자의 게시물 처리
    user_posts = db.query(Post).filter(Post.author_id == user_id).all()
    for post in user_posts:
        # 비디오 파일 삭제
        video_path = os.path.join(UPLOAD_DIR, post.video_filename)
        if os.path.exists(video_path):
            os.remove(video_path)
        # 게시물에 부여된 권한 삭제 (Post의 cascade로 자동 삭제됨)
        db.delete(post)

    # 사용자 삭제
    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


# ==================== 게시물 관리 ====================

@router.get("/posts", response_model=List[PostListResponse])
def get_all_posts(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    전체 게시물 목록 조회 (관리자 전용)

    - 모든 게시물 (public/private 포함) 조회 가능
    """
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    return posts
