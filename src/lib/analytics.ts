"use client";

import { todayKey } from "@/lib/constants";

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
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) cleaned[key] = value;
  }
  window.dataLayer.push({
    event,
    ...cleaned,
  });
}

const recentScreenViews = new Map<string, number>();

/**
 * screen_view with short-window dedupe (re-render / React Strict Mode).
 * Same screen can fire again after navigating away and returning.
 */
export function trackScreenView(
  screenName: string,
  payload: AnalyticsPayload = {},
  dedupeKey = ""
) {
  if (typeof window === "undefined") return;
  const key = `${screenName}:${dedupeKey}`;
  const now = Date.now();
  const prev = recentScreenViews.get(key) ?? 0;
  if (now - prev < 1500) return;
  recentScreenViews.set(key, now);
  trackEvent("screen_view", { screen_name: screenName, ...payload });
}

/** Once per user per calendar day (localStorage). Used by active_routine_users. */
export function trackEventOncePerUserDay(
  event: string,
  userId: string,
  payload: AnalyticsPayload = {}
) {
  if (typeof window === "undefined" || !userId) return;
  const key = `ana_once_${event}_${userId}_${todayKey()}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // private mode — still fire once this JS session via memory map
    const memKey = `mem:${key}`;
    if (recentScreenViews.has(memKey)) return;
    recentScreenViews.set(memKey, Date.now());
  }
  trackEvent(event, payload);
}

export function trackActiveRoutineUser(userId: string) {
  trackEventOncePerUserDay("active_routine_users", userId);
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
