# ANA — 피부 루틴 기록 MVP

Next.js 14 + Tailwind + Supabase

## Supabase 설정 (필수)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/ppxjklwepownrdyboaaj) 접속
2. **SQL Editor**에서 `supabase/schema.sql` 전체 실행  
   (이미 실행했다면 `supabase/20260710-otp-codes.sql`만 추가 실행)
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3506`
   - Redirect URLs에 추가:
     - `http://localhost:3506/**`
     - `http://localhost:3506/auth/callback`
4. (선택) Email confirm을 끄려면  
   Authentication → Providers → Email → **Confirm email** OFF  
   (켜두면 회원가입 후 메일 인증 필요)

Project ID: `ppxjklwepownrdyboaaj`  
URL: `https://ppxjklwepownrdyboaaj.supabase.co`

API 키는 `src/lib/server/secrets.ts`에 서버 전용으로 하드코딩되어 있다.

## 실행

```bash
npm install
npm run dev
```

→ http://localhost:3506

## 서버 API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/send-otp` | `{ email }` → 6자리 OTP 생성·저장·Resend 발송 (3분 만료) |
| POST | `/api/auth/verify-otp` | `{ email, otp }` → 일치/만료 확인 후 `resetToken` 반환 |
| POST | `/api/auth/reset-password` | `{ email, resetToken, password }` → 비밀번호 변경 |
| GET | `/api/products/search?query=&category=` | 네이버 쇼핑 검색 → title/image (category로 루틴 단계 필터) |
| POST | `/api/routines/recommend` | `{ skinType, concern, sensitivity }` → Claude 추천 루틴 |

## 연동된 기능

- Auth: 회원가입 / 로그인 / 로그아웃 / 비밀번호 찾기(OTP)
- DB: 프로필, 피부프로필, 루틴, 케어로그, 주간변화, 스킨노트, 댓글, 저장/도움돼요/숨김/신고
- 제품 검색: 네이버 쇼핑 (서버 프록시)
- 루틴 추천: Claude Haiku 실시간 생성
- 세션 복원: 앱 시작 시 `syncAuthState()`

## 디자인 참고

- **색상 토큰:** [`design/tokens.md`](./design/tokens.md)
- 시안·QA: [`design/`](./design/) (`design/README.md`)

## 화면

| 화면 | 경로 |
|------|------|
| 홈 | `/` |
| 피부 프로필 | `/skin-profile` |
| 루틴 등록 | `/routine/register` |
| 케어로그 | `/care-log` |
| 변화 기록 | `/care-log/change` |
| 루틴 종료 | `/routine/end` |
| 스킨노트 완성 | `/skin-note/complete` |
| 스킨서랍장 | `/drawer` |
| 스킨노트 상세 | `/notes/[id]` |
| 마이페이지 | `/mypage` |
| 설정 | `/settings` |
| 공지사항 | `/settings/notices` |
| 문의하기 | `/settings/inquiry` |
| 이용약관 | `/settings/terms` |
| 로그인/회원가입/비번찾기 | `/login` `/signup` `/forgot-password` |
| Auth 콜백 | `/auth/callback` |
