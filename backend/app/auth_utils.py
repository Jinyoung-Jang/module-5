"""
인증 유틸리티 모듈
- 비밀번호 해싱 및 검증 (bcrypt)
- JWT 토큰 생성 및 디코드
"""

import secrets
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

# 상수 정의
SECRET_KEY = secrets.token_hex(32)  # 개발용 랜덤 키 (프로덕션에서는 환경변수 사용)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# bcrypt 해싱 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    비밀번호를 bcrypt로 해싱합니다.

    Args:
        password: 평문 비밀번호

    Returns:
        해싱된 비밀번호
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    평문 비밀번호와 해싱된 비밀번호를 비교 검증합니다.

    Args:
        plain_password: 평문 비밀번호
        hashed_password: 해싱된 비밀번호

    Returns:
        비밀번호 일치 여부
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    JWT 액세스 토큰을 생성합니다.

    Args:
        data: 토큰에 포함할 데이터 (payload)
        expires_delta: 토큰 만료 시간 (기본: ACCESS_TOKEN_EXPIRE_MINUTES)

    Returns:
        인코딩된 JWT 토큰
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    JWT 토큰을 검증하고 디코드합니다.

    Args:
        token: JWT 토큰 문자열

    Returns:
        디코드된 페이로드 딕셔너리

    Raises:
        JWTError: 토큰이 유효하지 않거나 만료된 경우
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload
