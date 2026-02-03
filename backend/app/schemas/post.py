"""
Post 스키마 정의
- 게시물 생성, 수정, 응답용 스키마
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

from app.schemas.user import UserResponse


class PostBase(BaseModel):
    """게시물 기본 스키마"""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)


class PostCreate(PostBase):
    """게시물 생성 스키마"""
    is_public: bool = False


class PostUpdate(BaseModel):
    """게시물 수정 스키마"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    is_public: Optional[bool] = None


class PostResponse(BaseModel):
    """게시물 상세 응답 스키마"""
    id: int
    title: str
    description: Optional[str]
    video_filename: str
    video_original_name: str
    video_size: int
    author_id: int
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime]
    author: UserResponse

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """게시물 목록 응답 스키마"""
    id: int
    title: str
    description: Optional[str]
    video_filename: str
    video_original_name: str
    video_size: int
    author_id: int
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime]
    author: UserResponse

    class Config:
        from_attributes = True
