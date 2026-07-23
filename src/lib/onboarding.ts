/** 웹 최초 실행 온보딩 — 완료/건너뛰기 시에만 저장 (중단 후 재실행 시 처음부터) */
const KEY = "ana-onboarding-done";

export function hasCompletedOnboarding() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function completeOnboarding() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignore
  }
}

export const ONBOARDING_SLIDES = [
  { id: "ob-01", src: "/illustrations/onboarding/ob-01.png", alt: "ANA 시작하기" },
  { id: "ob-02", src: "/illustrations/onboarding/ob-02.png", alt: "루틴 등록 안내" },
  { id: "ob-03", src: "/illustrations/onboarding/ob-03.png", alt: "케어로그 기록 안내" },
  { id: "ob-04", src: "/illustrations/onboarding/ob-04.png", alt: "루틴 종료 피드백 안내" },
  { id: "ob-05", src: "/illustrations/onboarding/ob-05.png", alt: "스킨노트 공유 안내" },
] as const;
