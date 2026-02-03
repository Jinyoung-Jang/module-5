"""
애플리케이션 설정
- 업로드 디렉토리 설정
- 파일 크기 제한
- 허용 확장자
"""

import os
from pathlib import Path

# 프로젝트 루트
BASE_DIR = Path(__file__).resolve().parent.parent

# 업로드 설정
UPLOAD_DIR = str(BASE_DIR / "uploads" / "videos")
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov"}
