# OTP / 비밀번호 찾기 운영 체크리스트

QA Fail(비밀번호 찾기 1~3단계) 재검증 전에 아래를 적용하세요.

## 1. Supabase SQL

Supabase SQL Editor에서 실행:

- `supabase/schema.sql` (최초 1회)
- `supabase/20260710-otp-codes.sql` (OTP 테이블)

## 2. 환경 변수

로컬 `.env.local` / 배포 환경에 설정:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=ANA <onboarding@resend.dev>
```

선택(제품 검색 / 추천):

```bash
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
ANTHROPIC_API_KEY=
```

## 3. 재QA 시나리오

1. 가입된 이메일로 인증번호 받기
2. 메일 OTP 입력 → 3단계 진입
3. 새 비밀번호 설정 → 로그인

미설정 시 API는 `서버 환경변수가 설정되지 않았습니다.` 를 반환합니다.
