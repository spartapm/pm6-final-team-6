# OTP / 비밀번호 찾기 운영 체크리스트

QA Fail(비밀번호 찾기 1~3단계) 재검증 전에 아래를 적용하세요.

## 1. Supabase SQL

Supabase SQL Editor에서 실행:

- `supabase/schema.sql` (최초 1회)
- `supabase/20260710-otp-codes.sql` (OTP 테이블)

## 2. API 키

`.env` 불필요. 서버 키는 `src/lib/server/secrets.ts`, 클라이언트 Supabase는 `src/lib/supabase.ts`에 하드코딩되어 있습니다.

포함 키: Supabase service role, Resend, Naver, Anthropic

## 3. 재QA 시나리오

1. 가입된 이메일로 인증번호 받기
2. 메일 OTP 입력 → 3단계 진입
3. 새 비밀번호 설정 → 로그인
