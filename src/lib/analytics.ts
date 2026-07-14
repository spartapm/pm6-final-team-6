"use client";

export type AnalyticsPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/** GTM dataLayer push only — do not also call gtag() or events double-fire. */
export function trackEvent(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...payload,
  });
}

export function trackScreenView(
  screenName: string,
  payload: AnalyticsPayload = {}
) {
  trackEvent("screen_view", { screen_name: screenName, ...payload });
}

export function mapAgeRange(ageGroup: string) {
  if (ageGroup.startsWith("10")) return "10s";
  if (ageGroup.startsWith("20")) return "20s";
  if (ageGroup.startsWith("30")) return "30s";
  if (ageGroup.startsWith("40")) return "40s";
  return "50s";
}

export function mapGender(gender: string | null | undefined) {
  if (gender === "여성") return "female";
  if (gender === "남성") return "male";
  return undefined;
}

export function mapChangeStatus(feeling: string) {
  if (feeling === "변화가 있었어요") return "있음";
  if (feeling === "모르겠어요") return "모름";
  if (feeling === "변화가 없었어요") return "없음";
  return feeling;
}
