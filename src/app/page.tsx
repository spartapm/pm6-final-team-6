"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import FeatureHelpButton from "@/components/help/FeatureHelpButton";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import { SectionHeader } from "@/components/ui/PageHeader";
import { WEEKDAY_LABELS, getWeekDays, todayKey } from "@/lib/constants";
import { ILLUSTRATIONS, defaultAvatar } from "@/lib/illustrations";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";
import type { SkinNote } from "@/lib/types";

function SkyCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="sky"
      fullWidth
      onClick={onClick}
      className="relative z-[1] !rounded-[13px] justify-between px-5 text-[15px] font-extrabold text-ink"
    >
      <span>{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEFEFE] text-sky shadow-sm">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Button>
  );
}

function HonorCard({ label, note }: { label: string; note: SkinNote | null }) {
  return (
    <div className="rounded-[18px] bg-white p-2.5 text-center shadow-card">
      <p className="text-[11px] font-extrabold text-accent">{label}</p>
      <div className="mx-auto my-2.5 flex aspect-square w-full max-w-[84px] items-center justify-center overflow-hidden rounded-[14px] bg-[#F9FBFE]">
        {note ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.authorAvatar || defaultAvatar(note.authorId)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Illustration src={ILLUSTRATIONS.avatar1} alt="" width={64} height={64} />
        )}
      </div>
      <p className="truncate text-[12px] font-bold text-ink">
        {note?.authorNickname ?? "닉네임"}
      </p>
    </div>
  );
}

type DayCellState = "done" | "missed" | "empty";

function dayCellState(
  key: string,
  today: string,
  participated: Set<string>,
  historyStart: string | null
): DayCellState {
  if (key > today) return "empty";
  if (historyStart && key < historyStart) return "empty";
  if (!historyStart) return "empty";
  if (participated.has(key)) return "done";
  return "missed";
}

function ParticipationDayCell({
  state,
  isToday,
  weekday,
  dayLabel,
  showWeekday,
}: {
  state: DayCellState;
  isToday: boolean;
  weekday?: string;
  dayLabel?: string;
  showWeekday?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      {showWeekday && weekday ? (
        <span className="text-[11px] font-bold text-ink">{weekday}</span>
      ) : null}
      {dayLabel ? (
        <span className="text-[11px] font-bold text-ink-muted">{dayLabel}</span>
      ) : null}
      <div
        className={`flex h-10 w-9 items-center justify-center ${
          isToday ? "rounded-[10px] bg-[#F8899E]" : ""
        }`}
      >
        <div
          className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ${
            state === "empty"
              ? isToday
                ? "border border-white/80 bg-white/30"
                : "border border-[#DCE3F0] bg-white"
              : "bg-transparent"
          }`}
        >
          {state === "empty" ? null : (
            <Illustration
              src={ILLUSTRATIONS.weekDonePast}
              alt=""
              width={30}
              height={30}
              className={`h-[30px] w-[30px] object-contain ${
                state === "missed" ? "opacity-20" : "opacity-100"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[6];
  if (!first || !last) return "";
  return `${first.getMonth() + 1}.${first.getDate()} – ${last.getMonth() + 1}.${last.getDate()}`;
}

function formatMonthLabel(year: number, monthIndex: number) {
  return `${year}.${monthIndex + 1}`;
}

function ParticipationBoard({
  hasRoutine,
  participationCount,
  participatedDates,
  historyStart,
}: {
  hasRoutine: boolean;
  participationCount: number;
  participatedDates: Set<string>;
  historyStart: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = todayKey();
  const weekDays = getWeekDays();
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const monthCells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<{ key: string | null; date: Date | null }> = [];
    for (let i = 0; i < startPad; i += 1) cells.push({ key: null, date: null });
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(cursor.year, cursor.month, d);
      cells.push({ key: todayKey(date), date });
    }
    while (cells.length % 7 !== 0) cells.push({ key: null, date: null });
    return cells;
  }, [cursor.year, cursor.month]);

  return (
    <section data-help-id="home-week">
      <Card className="!p-4">
        <h2 className="text-[16px] font-extrabold leading-snug text-ink">
          {hasRoutine ? (
            <>
              이번 루틴{" "}
              <span className="text-[#F8899E]">{participationCount}</span>번 참여했어요
            </>
          ) : (
            "아직 루틴을 시작하지 않았어요."
          )}
        </h2>

        {!expanded ? (
          <>
            <p className="mt-1.5 text-[12px] font-semibold text-ink-muted">
              {formatWeekRange(weekDays)}
            </p>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {weekDays.map((day, i) => {
                const key = todayKey(day);
                return (
                  <ParticipationDayCell
                    key={key}
                    weekday={WEEKDAY_LABELS[i]}
                    dayLabel={String(day.getDate())}
                    showWeekday
                    isToday={key === today}
                    state={dayCellState(key, today, participatedDates, historyStart)}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-3 flex w-full items-center justify-center gap-1 py-1 text-[13px] font-bold text-ink-soft"
            >
              펼쳐보기
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 4.5L6 8l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="이전 달"
                onClick={() =>
                  setCursor((c) => {
                    const month = c.month - 1;
                    if (month < 0) return { year: c.year - 1, month: 11 };
                    return { year: c.year, month };
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft"
              >
                ‹
              </button>
              <p className="min-w-[4.5rem] text-center text-[15px] font-extrabold text-ink">
                {formatMonthLabel(cursor.year, cursor.month)}
              </p>
              <button
                type="button"
                aria-label="다음 달"
                onClick={() =>
                  setCursor((c) => {
                    const month = c.month + 1;
                    if (month > 11) return { year: c.year + 1, month: 0 };
                    return { year: c.year, month };
                  })
                }
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-y-2">
              {WEEKDAY_LABELS.map((label) => (
                <p
                  key={label}
                  className="text-center text-[11px] font-bold text-ink-muted"
                >
                  {label}
                </p>
              ))}
              {monthCells.map((cell, index) => {
                if (!cell.key || !cell.date) {
                  return <div key={`pad-${index}`} className="h-9" />;
                }
                return (
                  <ParticipationDayCell
                    key={cell.key}
                    isToday={cell.key === today}
                    state={dayCellState(
                      cell.key,
                      today,
                      participatedDates,
                      historyStart
                    )}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-3 flex w-full items-center justify-center gap-1 py-1 text-[13px] font-bold text-ink-soft"
            >
              접기
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 7.5L6 4l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </Card>
    </section>
  );
}

export default function HomePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { state, user, profile, activeRoutine, honor } = useAppDerivations();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      router.replace("/onboarding");
      return;
    }
    setOnboardingChecked(true);
  }, [router]);

  const participatedDates = useMemo(() => {
    const set = new Set<string>();
    for (const log of state.dailyLogs) set.add(log.date);
    return set;
  }, [state.dailyLogs]);

  const historyStart = useMemo(() => {
    const starts = state.routines
      .filter((r) => r.userId === state.currentUserId)
      .map((r) => todayKey(new Date(r.startedAt)));
    for (const log of state.dailyLogs) starts.push(log.date);
    if (!starts.length) return null;
    return starts.reduce((a, b) => (a < b ? a : b));
  }, [state.routines, state.dailyLogs, state.currentUserId]);

  const participationCount = useMemo(() => {
    if (!activeRoutine) return 0;
    const dates = new Set(
      state.dailyLogs
        .filter((l) => l.routineId === activeRoutine.id)
        .map((l) => l.date)
    );
    return dates.size;
  }, [state.dailyLogs, activeRoutine]);

  if (!onboardingChecked || !hydrated) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const loggedIn = Boolean(state.isLoggedIn && user);
  const hasProfile = Boolean(profile);
  const hasRoutine = Boolean(activeRoutine);

  const honorCards = [
    { key: "save", label: "저장 best", note: honor.bySave },
    { key: "comment", label: "댓글 best", note: honor.byComment },
    { key: "like", label: "도움돼요 best", note: honor.byHelp },
  ];

  const handleRoutineCta = () => {
    if (!loggedIn) {
      router.push("/login?next=/");
      return;
    }
    if (!hasProfile) {
      router.push("/skin-profile");
      return;
    }
    if (!hasRoutine) {
      router.push("/routine/register");
      return;
    }
    router.push("/care-log");
  };

  const helperText = !loggedIn
    ? null
    : !hasProfile || !hasRoutine
      ? "아직 피부 프로필과 루틴이 등록되지 않았어요. 먼저 피부 정보를 입력하고 루틴을 시작해보세요."
      : "내 피부 상태와 루틴을 기록하고 변화를 확인해보세요!";

  return (
    <AppShell>
      <div className="page-pad space-y-5 pt-5 animate-fade-up">
        <section className="relative flex items-start justify-between gap-2">
          <div className="absolute right-0 top-0 z-10">
            <FeatureHelpButton tourId="home" />
          </div>
          <div className="min-w-0 flex-1 pt-2 pr-14">
            <p className="text-[15px] font-semibold text-ink-soft">안녕하세요</p>
            <h1 className="mt-1 text-[32px] font-extrabold leading-[1.2] tracking-tight text-ink">
              오늘도 <span className="text-accent">피부</span>
              <br />
              <span className="text-accent">기록</span>해볼까요?
            </h1>
          </div>
          <Illustration
            src={ILLUSTRATIONS.homeHero}
            alt="ANA 캐릭터"
            width={110}
            height={100}
            className="mt-6 shrink-0 animate-soft-pop"
            priority
          />
        </section>

        <Card className="relative !p-5">
          {loggedIn ? (
            <>
              <div data-help-id="home-skin-profile">
                <h2 className="text-base font-extrabold text-ink">내 피부 프로필</h2>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                    <span className="shrink-0 text-[13px] font-semibold text-ink-soft">
                      피부 타입
                    </span>
                    {hasProfile ? (
                      <Badge>{profile!.skinType}</Badge>
                    ) : (
                      <Badge tone="muted">미등록</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                    <span className="shrink-0 text-[13px] font-semibold text-ink-soft">
                      주요 고민
                    </span>
                    {hasProfile ? (
                      profile!.concerns.map((c) => <Badge key={c}>{c}</Badge>)
                    ) : (
                      <Badge tone="muted">미등록</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5" data-help-id="home-routine-cta">
                <SkyCta label="오늘 루틴 기록하기" onClick={handleRoutineCta} />
                {helperText && (
                  <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-muted">
                    {helperText}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div
                data-help-id="home-skin-profile"
                className="pointer-events-none select-none blur-[2.5px] opacity-45"
              >
                <h2 className="text-base font-extrabold text-ink">내 피부 프로필</h2>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                    <span className="shrink-0 text-[13px] font-semibold text-ink-soft">
                      피부 타입
                    </span>
                    <Badge tone="muted">미등록</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                    <span className="shrink-0 text-[13px] font-semibold text-ink-soft">
                      주요 고민
                    </span>
                    <Badge tone="muted">미등록</Badge>
                  </div>
                </div>
              </div>
              <div className="relative z-[1] mt-4" data-help-id="home-routine-cta">
                <SkyCta
                  label="루틴 등록하러 로그인"
                  onClick={() => router.push("/login?next=/")}
                />
              </div>
            </>
          )}
        </Card>

        <ParticipationBoard
          hasRoutine={hasRoutine}
          participationCount={participationCount}
          participatedDates={participatedDates}
          historyStart={historyStart}
        />

        <section data-help-id="home-honor">
          <SectionHeader title="명예의 스킨노트" actionLabel="더보기 >" actionHref="/drawer" />
          <div className="grid grid-cols-3 gap-2.5">
            {honorCards.map((card) => (
              <HonorCard key={card.key} label={card.label} note={card.note} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
