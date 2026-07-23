import type { ChangeFeeling, Difficulty, SkinType } from "./types";

export const ILLUSTRATIONS = {
  homeHero: "/illustrations/home-hero.svg",
  featureHelp: "/illustrations/feature-help-icon.svg",
  weekDonePast: "/illustrations/week-done-past.svg",
  weekDoneToday: "/illustrations/week-done-today.svg",
  weekMissedPast: "/illustrations/week-missed-past.svg",
  weekMissedToday: "/illustrations/week-missed-today.svg",
  recommendEmpty: "/illustrations/recommend-empty.svg",
  endHero: "/illustrations/end-hero.svg",
  tagsHero1: "/illustrations/tags-hero-1.svg",
  tagsHero2: "/illustrations/tags-hero-2.svg",
  tagsHint: "/illustrations/tags-hint.svg",
  changeCard: "/illustrations/change-card.svg",
  endDiffEasy: "/illustrations/end-diff-easy.svg",
  endDiffNormal: "/illustrations/end-diff-normal.svg",
  endDiffHard: "/illustrations/end-diff-hard.svg",
  avatar1: "/illustrations/avatar-1.svg",
  avatar2: "/illustrations/avatar-2.svg",
  avatar3: "/illustrations/avatar-3.svg",
  avatar4: "/illustrations/avatar-4.svg",
} as const;

const CARE_BASE: Record<SkinType, string> = {
  건성: "/illustrations/care-base-dry.svg",
  지성: "/illustrations/care-base-oily.svg",
  복합성: "/illustrations/care-base-combo.svg",
  민감성: "/illustrations/care-base-sensitive.svg",
};

const CARE_DONE: Record<SkinType, string> = {
  건성: "/illustrations/care-done-dry.svg",
  지성: "/illustrations/care-done-oily.svg",
  복합성: "/illustrations/care-done-combo.svg",
  민감성: "/illustrations/care-done-sensitive.svg",
};

const END_DIFF: Record<Difficulty, string> = {
  쉬웠어요: ILLUSTRATIONS.endDiffEasy,
  보통이에요: ILLUSTRATIONS.endDiffNormal,
  어려웠어요: ILLUSTRATIONS.endDiffHard,
};

const AVATARS = [
  ILLUSTRATIONS.avatar1,
  ILLUSTRATIONS.avatar2,
  ILLUSTRATIONS.avatar3,
  ILLUSTRATIONS.avatar4,
];

export function careIllustration(skinType?: SkinType | null, allDone = false) {
  const type = skinType ?? "복합성";
  return allDone ? CARE_DONE[type] : CARE_BASE[type];
}

export function difficultyIllustration(difficulty: Difficulty) {
  return END_DIFF[difficulty];
}

export function weekFeelingIllustration(feeling: "yes" | "unknown" | "no") {
  if (feeling === "yes") return ILLUSTRATIONS.endDiffEasy;
  if (feeling === "unknown") return ILLUSTRATIONS.endDiffNormal;
  return ILLUSTRATIONS.endDiffHard;
}

/** 변화 과정 사진 미등록 시 / 감정 표시용 피치 캐릭터 */
export function peachFeelingIllustration(feeling?: ChangeFeeling | null) {
  if (feeling === "변화가 있었어요") return ILLUSTRATIONS.endDiffEasy;
  if (feeling === "변화가 없었어요") return ILLUSTRATIONS.endDiffHard;
  return ILLUSTRATIONS.endDiffNormal;
}

/** 유저 id/닉네임 기반 안정적인 기본 아바타 */
export function defaultAvatar(seed?: string | null) {
  if (!seed) return AVATARS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATARS.length;
  return AVATARS[hash];
}

export function weekDayIllustration(opts: {
  isToday: boolean;
  logged: boolean;
  isFuture: boolean;
  /** 루틴 시작일 이전 — 미참여와 구분되는 빈 슬롯 */
  beforeStart?: boolean;
}) {
  if (opts.isFuture || opts.beforeStart) return null;
  if (opts.isToday) {
    return opts.logged ? ILLUSTRATIONS.weekDoneToday : ILLUSTRATIONS.weekMissedToday;
  }
  return opts.logged ? ILLUSTRATIONS.weekDonePast : ILLUSTRATIONS.weekMissedPast;
}
