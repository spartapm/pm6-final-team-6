import type {
  AgeGroup,
  ChangeFeeling,
  Difficulty,
  EndReason,
  Product,
  RoutineStepCategory,
  SkinConcern,
  SkinType,
  Sensitivity,
} from "./types";

export const BRAND = "ANA";

export const SKIN_TYPES: SkinType[] = ["건성", "지성", "복합성", "민감성"];

export const SKIN_CONCERNS: SkinConcern[] = [
  "여드름/트러블",
  "색소침착",
  "모공/피지",
  "주름/탄력",
  "민감/붉음증",
  "보습/건조함",
  "미백/칙칙함",
  "각질",
];

export const SENSITIVITIES: Sensitivity[] = ["낮음", "보통", "높음"];

export const AGE_GROUPS: AgeGroup[] = ["10대", "20대", "30대", "40대", "50대 이상"];

export const ROUTINE_CATEGORIES: RoutineStepCategory[] = [
  "클렌징",
  "토너",
  "세럼",
  "앰플",
  "크림",
  "선크림",
  "마스크",
  "기타",
];

export const CHANGE_FEELINGS: Array<{ value: ChangeFeeling; emoji: string }> = [
  { value: "변화가 있었어요", emoji: "😊" },
  { value: "모르겠어요", emoji: "😐" },
  { value: "변화가 없었어요", emoji: "😶" },
];

export const END_REASONS: EndReason[] = [
  "변화가 느껴져서 마칠래요",
  "변화는 없지만 기록을 마칠래요",
  "지속하기 어려워서 그만할래요",
];

export const DIFFICULTIES: Difficulty[] = ["쉬웠어요", "보통이에요", "어려웠어요"];

export const CHANGE_TAGS = [
  "#붉은기 완화",
  "#촉촉해졌다",
  "#장벽 진정",
  "#피부결 개선",
  "#수분 충전",
  "#트러블 감소",
  "#모공 케어",
  "#각질 정돈",
  "#톤 업",
  "#탄력 개선",
  "#진정 효과",
  "#보습 강화",
  "#피지 조절",
  "#큰 변화 없음",
];

export const WEEKLY_CHANGE_TAGS = [
  "#붉은기 완화",
  "#촉촉해졌다",
  "#장벽 진정",
  "#피부결 개선",
  "#수분 충전",
  "#트러블 감소",
  "#모공 케어",
  "#각질 정돈",
  "#톤 업",
  "#탄력 개선",
  "#진정 효과",
  "#보습 강화",
  "#피지 조절",
];

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "p1", name: "약산성 젤 클렌저", brand: "라운드랩", category: "클렌징" },
  { id: "p2", name: "판테놀 토너", brand: "일리윤", category: "토너" },
  { id: "p3", name: "시카 세럼", brand: "닥터자르트", category: "세럼" },
  { id: "p4", name: "장벽 크림", brand: "아토팜", category: "크림" },
  { id: "p5", name: "수분 앰플", brand: "라네즈", category: "앰플" },
  { id: "p6", name: "진정 마스크", brand: "메디힐", category: "마스크" },
  { id: "p7", name: "무기자차 선크림", brand: "이니스프리", category: "선크림" },
  { id: "p8", name: "저자극 폼클렌저", brand: "세타필", category: "클렌징" },
  { id: "p9", name: "히알루론 토너", brand: "토리든", category: "토너" },
  { id: "p10", name: "나이아신아마이드 세럼", brand: "더보통", category: "세럼" },
  { id: "p11", name: "세라마이드 크림", brand: "세라브", category: "크림" },
  { id: "p12", name: "레티놀 앰플", brand: "이니스프리", category: "앰플" },
];

export const RECOMMEND_ROUTINES: Array<{
  id: string;
  title: string;
  steps: Array<{ category: RoutineStepCategory; productId: string }>;
}> = [
  {
    id: "rec-1",
    title: "진정·장벽 케어 루틴",
    steps: [
      { category: "클렌징", productId: "p1" },
      { category: "토너", productId: "p2" },
      { category: "세럼", productId: "p3" },
      { category: "크림", productId: "p4" },
    ],
  },
  {
    id: "rec-2",
    title: "수분 충전 루틴",
    steps: [
      { category: "클렌징", productId: "p8" },
      { category: "토너", productId: "p9" },
      { category: "앰플", productId: "p5" },
      { category: "크림", productId: "p11" },
    ],
  },
  {
    id: "rec-3",
    title: "트러블 케어 루틴",
    steps: [
      { category: "클렌징", productId: "p1" },
      { category: "토너", productId: "p9" },
      { category: "세럼", productId: "p10" },
      { category: "크림", productId: "p4" },
    ],
  },
];

export const DRAWER_CONCERN_FILTERS = [
  "전체",
  "여드름・트러블",
  "붉은기",
  "모공・피지",
  "속건조",
  "탄력 저하",
] as const;

export function concernFilterMatch(filter: string, concerns: SkinConcern[]) {
  if (filter === "전체") return true;
  const map: Record<string, SkinConcern[]> = {
    "여드름・트러블": ["여드름/트러블"],
    붉은기: ["민감/붉음증"],
    "모공・피지": ["모공/피지"],
    속건조: ["보습/건조함"],
    "탄력 저하": ["주름/탄력"],
  };
  const targets = map[filter] ?? [];
  return targets.some((c) => concerns.includes(c));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return todayKey(d);
}

export function formatDateDot(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function daysSince(iso: string) {
  const start = new Date(iso);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}달 전`;
  return `${Math.floor(month / 12)}년 전`;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function getWeekDays(base = new Date()) {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
