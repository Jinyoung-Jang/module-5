# 인증 시스템 테스트 체크리스트

## DB Layer 테스트

### User 모델 테스트
- [ ] User 모델 생성 테스트
  - [ ] email, hashed_password, full_name 필드 생성 확인
  - [ ] created_at, updated_at 자동 생성 확인
  - [ ] is_active 기본값 True 확인

### 제약 조건 테스트
- [ ] email unique 제약 조건 테스트
  - [ ] 동일한 이메일로 두 번 생성 시 에러 발생 확인
- [ ] email not null 제약 조건 테스트
  - [ ] email 없이 생성 시 에러 발생 확인
- [ ] hashed_password not null 제약 조건 테스트
  - [ ] password 없이 생성 시 에러 발생 확인

### CRUD 함수 테스트
- [ ] User 생성 테스트
  - [ ] 정상적인 User 생성 확인
  - [ ] 생성된 User의 id 자동 할당 확인
- [ ] User 조회 테스트
  - [ ] email로 User 조회 확인
  - [ ] id로 User 조회 확인
  - [ ] 존재하지 않는 User 조회 시 None 반환 확인

---

## BE Layer 테스트

### 인증 유틸리티 테스트
- [ ] 비밀번호 해싱 테스트
  - [ ] hash_password 함수 정상 작동 확인
  - [ ] 동일한 비밀번호도 매번 다른 해시 생성 확인 (salt)
- [ ] 비밀번호 검증 테스트
  - [ ] verify_password 정상 비밀번호 검증 확인
  - [ ] verify_password 틀린 비밀번호 거부 확인
- [ ] JWT 토큰 테스트
  - [ ] create_access_token 토큰 생성 확인
  - [ ] decode_access_token 토큰 디코드 확인
  - [ ] 유효하지 않은 토큰 디코드 시 에러 확인

### 회원가입 API 테스트
- [ ] POST /api/auth/register
  - [ ] 정상 회원가입 (201 status, UserResponse 반환)
  - [ ] 이메일 중복 시 400 에러
  - [ ] 잘못된 이메일 형식 시 422 에러
  - [ ] 비밀번호 6자 미만 시 422 에러
  - [ ] 비밀번호가 해싱되어 저장되는지 확인

### 로그인 API 테스트
- [ ] POST /api/auth/login
  - [ ] 정상 로그인 (200 status, Token 반환)
  - [ ] httpOnly cookie에 access_token 설정 확인
  - [ ] cookie의 max_age 1800초(30분) 확인
  - [ ] 존재하지 않는 이메일 로그인 시 401 에러
  - [ ] 틀린 비밀번호 로그인 시 401 에러

### 사용자 정보 조회 API 테스트
- [ ] GET /api/auth/me
  - [ ] 유효한 토큰으로 조회 시 UserResponse 반환
  - [ ] 토큰 없이 조회 시 401 에러
  - [ ] 유효하지 않은 토큰으로 조회 시 401 에러
  - [ ] 만료된 토큰으로 조회 시 401 에러

### 로그아웃 API 테스트
- [ ] POST /api/auth/logout
  - [ ] 로그아웃 시 cookie 삭제 확인
  - [ ] 로그아웃 후 /api/auth/me 호출 시 401 에러

---

## FE Layer 테스트

### API 유틸리티 테스트
- [ ] apiRequest 함수 테스트
  - [ ] 정상 요청 시 JSON 반환 확인
  - [ ] credentials: 'include' 설정 확인
  - [ ] 에러 응답 시 Error throw 확인

### AuthContext 테스트
- [ ] AuthProvider 렌더링 테스트
  - [ ] children 정상 렌더링 확인
  - [ ] 초기 로딩 상태 확인
- [ ] useAuth 훅 테스트
  - [ ] Provider 외부에서 호출 시 에러 확인
  - [ ] Provider 내부에서 정상 사용 확인

### 회원가입 페이지 테스트
- [ ] /register 페이지 렌더링 테스트
  - [ ] 이메일 입력 필드 렌더링 확인
  - [ ] 비밀번호 입력 필드 렌더링 확인
  - [ ] 이름 입력 필드 렌더링 확인
  - [ ] 제출 버튼 렌더링 확인
- [ ] 회원가입 폼 제출 테스트
  - [ ] 정상 회원가입 시 /login으로 리다이렉트
  - [ ] 에러 발생 시 에러 메시지 표시
  - [ ] 로딩 중 버튼 비활성화 확인

### 로그인 페이지 테스트
- [ ] /login 페이지 렌더링 테스트
  - [ ] 이메일 입력 필드 렌더링 확인
  - [ ] 비밀번호 입력 필드 렌더링 확인
  - [ ] 제출 버튼 렌더링 확인
  - [ ] 회원가입 링크 렌더링 확인
- [ ] 로그인 폼 제출 테스트
  - [ ] 정상 로그인 시 /dashboard로 리다이렉트
  - [ ] 에러 발생 시 에러 메시지 표시
  - [ ] 로딩 중 버튼 비활성화 확인

### 대시보드 페이지 테스트
- [ ] /dashboard 페이지 렌더링 테스트
  - [ ] 인증된 사용자 정보 표시 확인
  - [ ] 로그아웃 버튼 렌더링 확인
- [ ] 보호된 라우트 테스트
  - [ ] 미인증 사용자 /login으로 리다이렉트 확인
  - [ ] 로그아웃 시 /login으로 리다이렉트 확인
- [ ] 로그아웃 테스트
  - [ ] 로그아웃 버튼 클릭 시 로그아웃 함수 호출 확인

---

## 통합 테스트 (E2E)

### 전체 인증 플로우
- [ ] 회원가입 → 로그인 → 대시보드 → 로그아웃 전체 플로우
- [ ] 브라우저 새로고침 시 인증 상태 유지 확인
- [ ] httpOnly cookie 자동 전송 확인

---

## 테스트 실행 방법

### Backend
```bash
cd backend
pytest test/ -v
```

### Frontend
```bash
cd frontend
npm test
```

### Database
```bash
cd backend
pytest db/test/ -v
```
