# TODO List

## Feature: 로그인/회원가입 시스템

### DB Layer (db-agent)
- [ ] User 모델 생성
  - [ ] username (unique, required)
  - [ ] email (unique, required)
  - [ ] password_hash (required)
  - [ ] created_at, updated_at 타임스탬프
  - [ ] is_active (boolean, default=True)
- [ ] User CRUD 함수 구현
  - [ ] create_user (회원가입용)
  - [ ] get_user_by_username
  - [ ] get_user_by_email
  - [ ] update_user
- [ ] DB 테스트 작성
  - [ ] User 모델 생성 테스트
  - [ ] unique 제약조건 테스트
  - [ ] CRUD 함수 테스트

### BE Layer (be-agent)
- [ ] 인증 관련 스키마 정의
  - [ ] UserCreate (회원가입 요청)
  - [ ] UserLogin (로그인 요청)
  - [ ] UserResponse (사용자 정보 응답)
  - [ ] Token (JWT 토큰 응답)
- [ ] 비밀번호 해싱 유틸리티
  - [ ] password hashing (bcrypt/passlib)
  - [ ] password verification
- [ ] JWT 토큰 관리
  - [ ] access token 생성
  - [ ] token 검증 함수
  - [ ] get_current_user 의존성
- [ ] 인증 API 엔드포인트
  - [ ] POST /api/auth/register (회원가입)
  - [ ] POST /api/auth/login (로그인)
  - [ ] GET /api/auth/me (현재 사용자 정보)
  - [ ] POST /api/auth/logout (로그아웃 - optional)
- [ ] API 테스트 작성
  - [ ] 회원가입 테스트
  - [ ] 로그인 성공/실패 테스트
  - [ ] 인증된 요청 테스트

### FE Layer (fe-agent)
- [ ] 인증 관련 타입 정의
  - [ ] User 타입
  - [ ] LoginRequest, RegisterRequest 타입
  - [ ] AuthResponse 타입
- [ ] API 클라이언트 함수
  - [ ] register(username, email, password)
  - [ ] login(username, password)
  - [ ] getCurrentUser()
  - [ ] logout()
- [ ] 인증 상태 관리
  - [ ] localStorage/sessionStorage에 토큰 저장
  - [ ] Context API 또는 상태관리 (AuthContext)
  - [ ] 로그인 상태 확인 훅 (useAuth)
- [ ] 회원가입 페이지 (/register)
  - [ ] 회원가입 폼 (username, email, password, confirm password)
  - [ ] 유효성 검증
  - [ ] 에러 처리
  - [ ] 회원가입 성공 시 리다이렉트
- [ ] 로그인 페이지 (/login)
  - [ ] 로그인 폼 (username/email, password)
  - [ ] Remember me 옵션 (optional)
  - [ ] 에러 처리
  - [ ] 로그인 성공 시 리다이렉트
- [ ] 보호된 라우트 구현
  - [ ] ProtectedRoute 컴포넌트
  - [ ] 미인증 시 로그인 페이지로 리다이렉트
- [ ] 네비게이션 업데이트
  - [ ] 로그인/회원가입 링크 (미인증 시)
  - [ ] 사용자 메뉴/로그아웃 버튼 (인증 시)
- [ ] 컴포넌트 테스트
  - [ ] 로그인 폼 렌더링 테스트
  - [ ] 회원가입 폼 렌더링 테스트
  - [ ] 인증 플로우 통합 테스트

---

## 작업 순서 (권장)
1. DB Layer: User 모델 및 CRUD 구현
2. BE Layer: 인증 API 및 JWT 구현
3. FE Layer: 로그인/회원가입 UI 및 상태관리 구현
