# MP4 스트리밍 게시판 + 권한 관리 시스템

풀스택 웹 애플리케이션으로 MP4 비디오 스트리밍 게시판과 사용자별 접근 권한 관리 기능을 제공합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS (App Router) |
| **Backend** | Python 3.12, FastAPI |
| **Database** | SQLite (SQLAlchemy ORM) |
| **Authentication** | JWT (httpOnly Cookie) |

## 주요 기능

### 사용자 기능
- 회원가입 / 로그인 / 로그아웃
- 비디오 게시물 업로드 (MP4, WebM, MOV 지원)
- 게시물 목록 조회 (썸네일 미리보기)
- 비디오 스트리밍 재생 (Range 요청 지원)
- 게시물 공개/비공개 설정

### 관리자 기능
- 전체 사용자 관리 (조회, 수정, 삭제)
- 전체 게시물 관리
- 게시물별 접근 권한 관리 (특정 사용자에게 권한 부여)
- 대시보드 통계 (사용자 수, 게시물 수)

### 권한 시스템
- **Public 게시물**: 모든 로그인 사용자가 접근 가능
- **Private 게시물**: 작성자, 관리자, 권한 부여된 사용자만 접근 가능
- 첫 번째 가입자가 자동으로 관리자 권한 획득

## 프로젝트 구조

```
module_5-main/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI 앱 진입점
│       ├── database.py          # SQLAlchemy 설정
│       ├── config.py            # 업로드 설정
│       ├── auth_utils.py        # JWT, 비밀번호 해싱
│       ├── dependencies.py      # 인증/권한 의존성
│       ├── models/              # SQLAlchemy 모델
│       │   ├── user.py
│       │   ├── post.py
│       │   └── post_permission.py
│       ├── schemas/             # Pydantic 스키마
│       │   ├── user.py
│       │   ├── post.py
│       │   └── permission.py
│       ├── routers/             # API 엔드포인트
│       │   ├── auth.py          # 인증 API
│       │   ├── posts.py         # 게시물 CRUD
│       │   ├── stream.py        # 비디오 스트리밍
│       │   ├── permissions.py   # 권한 관리
│       │   └── admin.py         # 관리자 API
│       └── uploads/videos/      # 업로드된 비디오 저장
│
└── frontend/
    └── src/
        ├── app/                 # Next.js 페이지
        │   ├── page.tsx         # 메인 (리다이렉트)
        │   ├── login/           # 로그인
        │   ├── register/        # 회원가입
        │   ├── board/           # 게시판 목록/상세
        │   ├── upload/          # 업로드
        │   └── admin/           # 관리자 페이지
        │       ├── users/       # 사용자 관리
        │       └── posts/       # 게시물/권한 관리
        ├── components/          # React 컴포넌트
        │   ├── Navbar.tsx
        │   ├── VideoPlayer.tsx
        │   ├── PostCard.tsx
        │   ├── UploadForm.tsx
        │   ├── UserTable.tsx
        │   └── PermissionManager.tsx
        ├── contexts/            # React Context
        │   └── AuthContext.tsx
        ├── lib/                 # 유틸리티
        │   └── api.ts
        └── types/               # TypeScript 타입
            └── index.ts
```

## 설치 및 실행

### 사전 요구사항
- Python 3.12+
- Node.js 18+
- npm

### Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (localhost:8000)
uvicorn app.main:app --reload
```

### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (localhost:3000)
npm run dev
```

### 접속
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs

## API 엔드포인트

### 인증 (`/api/auth`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/register` | 회원가입 |
| POST | `/login` | 로그인 |
| POST | `/logout` | 로그아웃 |
| GET | `/me` | 현재 사용자 정보 |

### 게시물 (`/api/posts`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `` | 접근 가능한 게시물 목록 |
| POST | `` | 게시물 생성 (파일 업로드) |
| GET | `/{id}` | 게시물 상세 |
| PUT | `/{id}` | 게시물 수정 |
| DELETE | `/{id}` | 게시물 삭제 |

### 스트리밍 (`/api/stream`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/{post_id}` | 비디오 스트리밍 (Range 지원) |

### 권한 (`/api/posts/{id}/permissions`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` | 권한 목록 |
| POST | `/` | 권한 추가 |
| DELETE | `/{user_id}` | 권한 삭제 |

### 관리자 (`/api/admin`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/stats` | 통계 |
| GET | `/users` | 전체 사용자 목록 |
| GET | `/users/{id}` | 사용자 상세 |
| PUT | `/users/{id}` | 사용자 수정 |
| DELETE | `/users/{id}` | 사용자 삭제 |
| GET | `/posts` | 전체 게시물 목록 |

## 데이터베이스 모델

### User
- id, email, hashed_password, full_name, is_active, is_admin, created_at, updated_at

### Post
- id, title, description, video_filename, video_original_name, video_size, author_id, is_public, created_at, updated_at

### PostPermission
- id, post_id, user_id, permission_type, created_at

## 환경 설정

### 업로드 설정 (`backend/app/config.py`)
- `UPLOAD_DIR`: 비디오 저장 경로
- `MAX_FILE_SIZE`: 최대 파일 크기 (기본 500MB)
- `ALLOWED_EXTENSIONS`: 허용 확장자 (.mp4, .webm, .mov)

## 라이선스

MIT License
