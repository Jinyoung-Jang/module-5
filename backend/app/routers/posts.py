"""
Posts API 라우터
- 게시물 CRUD
- 파일 업로드
"""

import os
import uuid
import shutil
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User, Post, PostPermission
from app.schemas import PostCreate, PostUpdate, PostResponse, PostListResponse
from app.dependencies import get_current_user, check_post_access
from app.config import UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_EXTENSIONS

router = APIRouter(prefix="/api/posts", tags=["posts"])


def validate_file_extension(filename: str) -> str:
    """파일 확장자 검증"""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return ext


def generate_unique_filename(original_filename: str) -> str:
    """UUID로 고유한 파일명 생성"""
    ext = os.path.splitext(original_filename)[1].lower()
    return f"{uuid.uuid4()}{ext}"


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    title: str = Form(...),
    description: str = Form(None),
    is_public: str = Form("false"),
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물 생성 + 파일 업로드

    - multipart/form-data로 제목, 설명, 공개여부, 비디오 파일 전송
    - UUID로 파일명 생성 후 저장
    """
    # is_public 문자열을 bool로 변환
    is_public_bool = is_public.lower() in ("true", "1", "yes")

    # 확장자 검증
    validate_file_extension(video.filename)

    # 업로드 디렉토리 생성
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 고유한 파일명 생성
    unique_filename = generate_unique_filename(video.filename)
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 파일 저장 (shutil 사용)
    try:
        # UploadFile의 file 객체를 직접 사용
        video.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        # 파일 크기 확인
        file_size = os.path.getsize(file_path)

        if file_size > MAX_FILE_SIZE:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Post 생성
    new_post = Post(
        title=title,
        description=description,
        video_filename=unique_filename,
        video_original_name=video.filename,
        video_size=file_size,
        author_id=current_user.id,
        is_public=is_public_bool
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return new_post


@router.get("", response_model=List[PostListResponse])
def get_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    접근 가능한 게시물 목록 조회

    - 본인이 작성한 게시물
    - public 게시물
    - 권한이 부여된 게시물
    - 관리자는 모든 게시물 조회 가능
    """
    if current_user.is_admin:
        # 관리자는 모든 게시물 조회 가능
        posts = db.query(Post).order_by(Post.created_at.desc()).all()
    else:
        # 권한이 있는 게시물 ID 조회
        permission_post_ids = db.query(PostPermission.post_id).filter(
            PostPermission.user_id == current_user.id
        ).subquery()

        # 본인 작성, public, 권한 있는 게시물 조회
        posts = db.query(Post).filter(
            or_(
                Post.author_id == current_user.id,
                Post.is_public == True,
                Post.id.in_(permission_post_ids)
            )
        ).order_by(Post.created_at.desc()).all()

    return posts


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물 상세 조회

    - 권한 체크 후 반환
    """
    post = await check_post_access(post_id, db, current_user)
    return post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물 수정

    - 작성자 또는 관리자만 수정 가능
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # 작성자 또는 관리자만 수정 가능
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )

    # 수정할 필드만 업데이트
    update_data = post_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(post, field, value)

    db.commit()
    db.refresh(post)

    return post


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    게시물 삭제

    - 작성자 또는 관리자만 삭제 가능
    - 연관된 비디오 파일도 삭제
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # 작성자 또는 관리자만 삭제 가능
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )

    # 비디오 파일 삭제
    video_path = os.path.join(UPLOAD_DIR, post.video_filename)
    if os.path.exists(video_path):
        os.remove(video_path)

    # 게시물 삭제 (cascade로 권한도 함께 삭제)
    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}
