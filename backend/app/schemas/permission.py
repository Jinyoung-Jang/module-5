"""
Permission 스키마 정의
- 게시물 권한 생성, 응답용 스키마
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.schemas.user import UserResponse


class PermissionCreate(BaseModel):
    """권한 생성 스키마"""
    user_id: Optional[int] = None
    user_identifier: Optional[str] = None  # 이메일로도 찾을 수 있음
    permission_type: str = "read"


class PermissionResponse(BaseModel):
    """권한 응답 스키마"""
    id: int
    post_id: int
    user_id: int
    permission_type: str
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True
