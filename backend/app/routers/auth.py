"""
인증 API 라우터
- 회원가입, 로그인, 로그아웃
- httpOnly cookie 기반 JWT 인증
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, Token, UserResponse
from app.auth_utils import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    회원가입 엔드포인트

    - 이메일 중복 체크
    - 비밀번호 해싱 후 저장
    - 생성된 사용자 정보 반환
    """
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 비밀번호 해싱
    hashed_password = hash_password(user_data.password)

    # User 생성
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    로그인 엔드포인트

    - 이메일/비밀번호 검증
    - JWT 토큰 생성
    - httpOnly cookie에 토큰 설정
    """
    # 이메일로 사용자 조회
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # 비밀번호 검증
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # JWT 토큰 생성
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Response에 httpOnly cookie 설정
    response = Response(status_code=200)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,      # JavaScript 접근 불가 (XSS 방지)
        secure=False,       # 개발 환경(HTTP)에서는 False, 프로덕션(HTTPS)에서는 True
        samesite="lax",     # CSRF 방지
        max_age=1800        # 30분 (초 단위)
    )

    # 응답 바디 설정
    token_response = Token(access_token=access_token, token_type="bearer")
    response.body = token_response.model_dump_json().encode()
    response.headers["content-type"] = "application/json"

    return response


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 조회

    - Cookie에서 토큰 자동 추출 (get_current_user 의존성)
    - 사용자 정보 반환
    """
    return current_user


@router.post("/logout")
def logout(response: Response):
    """
    로그아웃 엔드포인트

    - httpOnly cookie 삭제
    """
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}
