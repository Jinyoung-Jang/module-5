# TODO List

## Feature: 로그인/회원가입 시스템 ✅ 완료

### DB Layer (db-agent) ✅
- [x] User 모델 생성
  - [x] email (unique, required)
  - [x] hashed_password (required)
  - [x] full_name (optional)
  - [x] created_at, updated_at 타임스탬프
  - [x] is_active (boolean, default=True)
- [x] User CRUD 함수 구현 (라우터 인라인)
  - [x] create_user (회원가입용)
  - [x] get_user_by_email
  - [x] get_user_by_id
- [x] DB 테스트 작성 (28개 테스트 통과)
  - [x] User 모델 생성 테스트
  - [x] unique 제약조건 테스트
  - [x] CRUD 함수 테스트

### BE Layer (be-agent) ✅
- [x] 인증 관련 스키마 정의
  - [x] UserRegister (회원가입 요청)
  - [x] UserLogin (로그인 요청)
  - [x] UserResponse (사용자 정보 응답)
  - [x] Token (JWT 토큰 응답)
- [x] 비밀번호 해싱 유틸리티
  - [x] password hashing (bcrypt/passlib)
  - [x] password verification
- [x] JWT 토큰 관리
  - [x] access token 생성
  - [x] token 검증 함수
  - [x] get_current_user 의존성
- [x] 인증 API 엔드포인트 (httpOnly cookie 방식)
  - [x] POST /api/auth/register (회원가입)
  - [x] POST /api/auth/login (로그인, httpOnly cookie)
  - [x] GET /api/auth/me (현재 사용자 정보)
  - [x] POST /api/auth/logout (로그아웃)
- [x] API 테스트 작성 (52개 테스트 통과)
  - [x] 회원가입 테스트
  - [x] 로그인 성공/실패 테스트
  - [x] httpOnly cookie 설정 테스트
  - [x] 인증된 요청 테스트

### FE Layer (fe-agent) ✅
- [x] 인증 관련 타입 정의
  - [x] User 타입
  - [x] AuthContextType 타입
- [x] API 클라이언트 함수
  - [x] register(email, password, fullName)
  - [x] login(email, password)
  - [x] getCurrentUser()
  - [x] logout()
  - [x] apiRequest (credentials: 'include')
- [x] 인증 상태 관리
  - [x] httpOnly cookie 방식 (localStorage 대신)
  - [x] Context API (AuthContext)
  - [x] 로그인 상태 확인 훅 (useAuth)
- [x] 회원가입 페이지 (/register)
  - [x] 회원가입 폼 (email, password, full_name)
  - [x] 유효성 검증
  - [x] 에러 처리
  - [x] 회원가입 성공 시 /login 리다이렉트
- [x] 로그인 페이지 (/login)
  - [x] 로그인 폼 (email, password)
  - [x] 에러 처리
  - [x] 로그인 성공 시 /dashboard 리다이렉트
  - [x] 회원가입 링크
- [x] 대시보드 페이지 (/dashboard)
  - [x] 사용자 정보 표시
  - [x] 미인증 시 /login 리다이렉트
  - [x] 로그아웃 버튼
- [x] 컴포넌트 테스트 (49개 테스트 통과)
  - [x] 로그인 폼 렌더링 테스트
  - [x] 회원가입 폼 렌더링 테스트
  - [x] 대시보드 렌더링 테스트
  - [x] 인증 플로우 통합 테스트

---

## 작업 순서 (권장)
1. DB Layer: User 모델 및 CRUD 구현
2. BE Layer: 인증 API 및 JWT 구현
3. FE Layer: 로그인/회원가입 UI 및 상태관리 구현
