# Design Tokens

디자인 시스템 색상·그라데이션 기준표입니다.  
구현은 `src/app/globals.css` + `tailwind.config.ts`에 동기화합니다. 화면 리디자인 시 이 값을 우선합니다.

## 페이지 배경

| 용도 | 값 |
|------|-----|
| 그라데이션 시작 | `#DDEBFF` |
| 그라데이션 끝 | `#FFFFFF` |

`linear-gradient(180deg, #DDEBFF 0%, #FFFFFF 100%)`

## 타이포 컬러

| 용도 | 값 | 토큰 |
|------|-----|------|
| 기본 진한 글씨 | `#1E2329` | `ink` / `--color-ink` |
| 보조 글씨 | `#707786` | `ink-soft`, `ink-muted` / `--color-ink-soft` |
| 작은 임팩트 글씨 | `#FB89A3` | `accent` / `--color-accent` |

## 버튼

| 용도 | 값 | 토큰 / 클래스 |
|------|-----|----------------|
| 기본 버튼 채우기 | `#F9FBFE` | `surface-card` |
| 기본 버튼 외곽선 | `#7BA5FD` | `sky` / `border-sky` |
| 버튼 외각(채우기 계열) | `#F9FBFE` | `surface-card` |
| 활성화 버튼 | `#7BA5FD` | `sky` / `variant="primary"` |
| 비활성화 버튼 | `#F2F5F9` | `btn-disabled` |
| 작은 임팩트 버튼 | `#FAEEF4` | `accent-faint` / `variant="secondary"` |

### 오늘 루틴 기록하기 (스카이 CTA)

| 스톱 | 값 |
|------|-----|
| 0% | `#AFC9F8` |
| 37% | `#D0E0FC` |
| 100% | `#EAF2FE` |
| 외곽선 | `#FEFEFE` |

클래스: `.btn-sky` / `variant="sky"`

## 카드

| 용도 | 값 | 토큰 |
|------|-----|------|
| 카드 채우기 | `#F9FBFE` | `surface-card` |
| 카드 외곽선 | `#7CA5FE` | `line` / `--color-line` |

## 기타

| 용도 | 값 | 토큰 |
|------|-----|------|
| 제품 이미지 없을 시 | `#F5F5F5` | `surface-empty` |
| 별점 비활성 | `#F9FBFE` | `star-empty` |
| 별점 활성 | `#7CA5FE` | `star` / `line` |
| 폼 에러 문구 | `#FF0000` · 10pt | `text-[10px] text-[#ff0000]` |

## Tailwind 매핑 요약

```
ink          #1E2329
ink-soft     #707786
ink-muted    #707786
accent       #FB89A3
accent-faint #FAEEF4
sky          #7BA5FD   (활성·기본 외곽)
line         #7CA5FE   (카드·별점 활성)
surface-card #F9FBFE
surface-page #DDEBFF
btn-disabled #F2F5F9
surface-empty #F5F5F5
```

최종 업데이트: 2026-07-14
