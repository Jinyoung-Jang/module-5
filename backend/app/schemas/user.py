from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """회원가입 요청 스키마"""
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None


class UserLogin(BaseModel):
    """로그인 요청 스키마"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """로그인 응답 스키마 (JWT 토큰)"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """사용자 정보 응답 스키마"""
    id: int
    email: str
    full_name: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserAdminUpdate(BaseModel):
    """관리자용 사용자 수정 스키마"""
    email: str | None = None
    full_name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
