"""
Stream API 라우터
- MP4 비디오 스트리밍
- Range 요청 지원
"""

import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.dependencies import get_current_user, check_post_access
from app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/stream", tags=["stream"])


def get_content_type(filename: str) -> str:
    """파일 확장자에 따른 Content-Type 반환"""
    ext = os.path.splitext(filename)[1].lower()
    content_types = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
    }
    return content_types.get(ext, "application/octet-stream")


def ranged_file_generator(file_path: str, start: int, end: int, chunk_size: int = 1024 * 1024):
    """Range 요청에 대한 파일 청크 생성기"""
    with open(file_path, "rb") as f:
        f.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk = f.read(min(chunk_size, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@router.get("/{post_id}")
async def stream_video(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MP4 비디오 스트리밍

    - 권한 체크 후 비디오 스트리밍
    - Range 요청 지원 (부분 다운로드)
    """
    # 권한 체크
    post = await check_post_access(post_id, db, current_user)

    # 비디오 파일 경로
    video_path = os.path.join(UPLOAD_DIR, post.video_filename)

    if not os.path.exists(video_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video file not found"
        )

    file_size = os.path.getsize(video_path)
    content_type = get_content_type(post.video_filename)

    # Range 헤더 확인
    range_header = request.headers.get("range")

    if range_header:
        # Range 요청 처리
        # 형식: bytes=start-end 또는 bytes=start-
        range_str = range_header.replace("bytes=", "")
        range_parts = range_str.split("-")

        start = int(range_parts[0]) if range_parts[0] else 0
        end = int(range_parts[1]) if range_parts[1] else file_size - 1

        # 범위 유효성 검사
        if start >= file_size:
            raise HTTPException(
                status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                detail="Requested range not satisfiable"
            )

        if end >= file_size:
            end = file_size - 1

        content_length = end - start + 1

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": content_type,
        }

        return StreamingResponse(
            ranged_file_generator(str(video_path), start, end),
            status_code=status.HTTP_206_PARTIAL_CONTENT,
            headers=headers,
            media_type=content_type
        )
    else:
        # 전체 파일 전송
        def file_generator():
            with open(video_path, "rb") as f:
                while chunk := f.read(1024 * 1024):  # 1MB 청크
                    yield chunk

        headers = {
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Content-Type": content_type,
        }

        return StreamingResponse(
            file_generator(),
            status_code=status.HTTP_200_OK,
            headers=headers,
            media_type=content_type
        )
