# ANA — 피부 루틴 기록 MVP

Next.js 14 + Tailwind + Supabase

## Supabase 설정 (필수)

1. [Supabase Dashboard](https://supabase.com/dashboard/project/ppxjklwepownrdyboaaj) 접속
2. **SQL Editor**에서 `supabase/schema.sql` 전체 실행
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

## 실행

```bash
npm install
npm run dev
```

→ http://localhost:3506

## 연동된 기능

- Auth: 회원가입 / 로그인 / 로그아웃 / 비밀번호 재설정 메일
- DB: 프로필, 피부프로필, 루틴, 케어로그, 주간변화, 스킨노트, 댓글, 저장/도움돼요/숨김/신고
- 세션 복원: 앱 시작 시 `syncAuthState()`

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
| 로그인/회원가입/비번찾기 | `/login` `/signup` `/forgot-password` |
| Auth 콜백 | `/auth/callback` |
