# Design

시안·QA·토큰 참고 자료를 모아 둔 폴더입니다. 앱 런타임에는 사용하지 않습니다.

## 구조

| 경로 | 내용 |
|------|------|
| **`tokens.md`** | **디자인 시스템 색상 기준표 (소스 오브 트루스)** |
| `mockups/` | 화면별 시안 PNG |
| `mockups/home-refresh/` | 홈 리디자인 시안 (2026-07) |
| `mockups/skin-profile/` | 피부 프로필 시안 |
| `qa/` | QA Fail 리스트·스크린샷 |

화면 리디자인·컴포넌트 수정 시 항상 [`tokens.md`](./tokens.md)를 먼저 확인하세요.  
구현 반영: `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/*`

## 홈 리디자인 (`home-refresh/`)

1. `01-logged-in-no-routine.png` — 로그인 · 프로필/루틴 미등록
2. `02-logged-in-with-profile.png` — 로그인 · 프로필·주간 기록 있음
3. `03-guest.png` — 비로그인 (프로필 블러 + 로그인 CTA)

## 피부 프로필 (`skin-profile/`)

- `02-skin-profile.png` — 피부 프로필 등록

## 루틴 등록 (`routine-register/`)

1. `01-recommend-empty.png` — 맞춤 추천 · 결과 없음
2. `02-recommend-preview.png` — 맞춤 추천 · 미리보기
3. `03-manual-steps.png` — 직접 만들기 · 단계 설정
4. `04-product-picker.png` — 제품 검색 시트

## 케어로그 (`care-log/`)

1. `00-change-tags.png` — 변화 태그 선택/미선택
2. `01-main-progress.png` — 메인 · 진행 중
3. `02-change-record.png` — 변화 과정 기록
4. `03-change-done.png` — 주간 기록 완료

## 루틴 종료 (`routine-end/`)

1. `01-change-tags.png` — 변화 태그 선택
2. `02-routine-end.png` — 루틴 종료 폼

## 스킨노트 (`skin-note/`)

- `01-complete.png` — 스킨노트 완성 카드

## 스킨 서랍장 (`drawer/`)

1. `01-list.png` — 목록
2. `02-filter.png` — 조건 선택
3. `03-detail.png` — 스킨노트 상세
4. `04-detail-alt.png` — 스킨노트 상세 (변형)

## 마이페이지 / 인증 (`mypage/`)

1. `01-forgot-1.png` — 비밀번호 찾기 1/3
2. `02-signup.png` — 회원가입
3. `03-forgot-2.png` — 비밀번호 찾기 2/3
4. `04-forgot-3.png` — 비밀번호 찾기 3/3
5. `05-mypage-empty.png` — 마이페이지 (루틴 없음)
6. `06-login.png` — 로그인
7. `07-note-preview.png` — 스킨노트 미리보기
8. `08-mypage.png` — 마이페이지

## 설정 (`settings/`)

1. `04-settings.png` — 설정 홈
2. `05-notices.png` — 공지사항
3. `02-inquiry.png` — 문의하기
4. `01-terms.png` — 이용약관
5. `03-privacy.png` — 개인정보 처리방침

> 이용약관·개인정보 처리방침 본문은 플레이스홀더. 최종 텍스트 제공 시 `src/app/settings/terms/page.tsx`에 교체.

## 모달 (`modals/`) — 후속 반영 예정

1. `01-confirm-end-routine.png` — 루틴 종료 확인 (아니요=채움 / 예=아웃라인)
2. `02-routine-type-picker.png` — 루틴 종류·제품 선택 시트

원본 일러스트 SVG는 `../assets/` → 빌드용은 `../public/illustrations/`. 매핑은 `../assets/README.md`.
