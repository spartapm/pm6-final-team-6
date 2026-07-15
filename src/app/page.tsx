"use client";

import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import { SectionHeader } from "@/components/ui/PageHeader";
import { WEEKDAY_LABELS, getWeekDays, todayKey } from "@/lib/constants";
import { ILLUSTRATIONS, defaultAvatar, weekDayIllustration } from "@/lib/illustrations";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";
import type { SkinNote } from "@/lib/types";

function SkyCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="sky"
      fullWidth
      onClick={onClick}
      className="relative z-[1] justify-between px-5 text-[15px] font-extrabold text-ink"
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

export default function HomePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { state, user, profile, activeRoutine, honor } = useAppDerivations();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const loggedIn = Boolean(state.isLoggedIn && user);
  const hasProfile = Boolean(profile);
  const hasRoutine = Boolean(activeRoutine);
  const weekDays = getWeekDays();
  const today = todayKey();

  const honorCards = [
    { key: "save", label: "저장 best", note: honor.bySave },
    { key: "comment", label: "댓글 best", note: honor.byComment },
    { key: "like", label: "좋아요 best", note: honor.byHelp },
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
          <div className="min-w-0 flex-1 pt-2">
            <p className="text-[15px] font-semibold text-ink-soft">안녕하세요</p>
            <h1 className="mt-1 text-[22px] font-extrabold leading-snug tracking-tight text-ink">
              오늘도 <span className="text-accent">피부</span>{" "}
              <span className="text-accent">기록</span>
              해볼까요?
            </h1>
          </div>
          <Illustration
            src={ILLUSTRATIONS.homeHero}
            alt="ANA 캐릭터"
            width={110}
            height={100}
            className="shrink-0 animate-soft-pop"
            priority
          />
        </section>

        <Card className="relative !p-5">
          {loggedIn ? (
            <>
              <h2 className="text-base font-extrabold text-ink">내 피부 프로필</h2>
              <div className="mt-3 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-[4.5rem] text-[13px] font-semibold text-ink-soft">
                    피부 타입
                  </span>
                  {hasProfile ? (
                    <Badge>{profile!.skinType}</Badge>
                  ) : (
                    <Badge tone="muted">미등록</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <span className="w-[4.5rem] pt-0.5 text-[13px] font-semibold text-ink-soft">
                    주요 고민
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hasProfile ? (
                      profile!.concerns.map((c) => <Badge key={c}>{c}</Badge>)
                    ) : (
                      <Badge tone="muted">미등록</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5">
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
              <div className="pointer-events-none select-none blur-[2.5px] opacity-45">
                <h2 className="text-base font-extrabold text-ink">내 피부 프로필</h2>
                <div className="mt-3 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-[4.5rem] text-[13px] font-semibold text-ink-soft">
                      피부 타입
                    </span>
                    <Badge tone="muted">미등록</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-[4.5rem] text-[13px] font-semibold text-ink-soft">
                      주요 고민
                    </span>
                    <Badge tone="muted">미등록</Badge>
                  </div>
                </div>
              </div>
              <div className="relative z-[1] mt-4">
                <SkyCta
                  label="루틴 등록하러 로그인"
                  onClick={() => router.push("/login?next=/")}
                />
              </div>
            </>
          )}
        </Card>

        <section>
          <SectionHeader title="명예의 스킨노트" actionLabel="더보기 >" actionHref="/drawer" />
          <div className="grid grid-cols-3 gap-2.5">
            {honorCards.map((card) => (
              <HonorCard key={card.key} label={card.label} note={card.note} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="이번주 참여 기록" />
          {hasRoutine ? (
            <div className="grid grid-cols-7 gap-1.5">
              {weekDays.map((day, i) => {
                const key = todayKey(day);
                const logged = state.dailyLogs.some(
                  (l) => l.date === key && l.routineId === activeRoutine!.id
                );
                const isToday = key === today;
                const startKey = todayKey(new Date(activeRoutine!.startedAt));
                const beforeStart = key < startKey;
                const isFuture = day.getTime() > new Date(today).getTime();
                const icon = weekDayIllustration({
                  isToday,
                  logged,
                  isFuture,
                  beforeStart,
                });
                const showRing =
                  (isToday && !beforeStart) || (!icon && !beforeStart && isFuture);
                return (
                  <div
                    key={key}
                    className="flex min-w-0 flex-col items-center gap-1.5 rounded-[16px] bg-white px-0.5 py-2 shadow-card"
                  >
                    <span className="text-[11px] font-bold text-ink">
                      {WEEKDAY_LABELS[i]}
                    </span>
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                      {isToday && !beforeStart && (
                        <span className="pointer-events-none absolute -right-0.5 -top-1 text-[9px] leading-none text-accent">
                          ✦✦
                        </span>
                      )}
                      <div
                        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ${
                          showRing
                            ? "border-2 border-accent bg-white"
                            : icon
                              ? "bg-transparent"
                              : "border border-accent/40 bg-white"
                        }`}
                      >
                        {icon ? (
                          <Illustration
                            src={icon}
                            alt=""
                            width={30}
                            height={30}
                            className="h-[30px] w-[30px] object-contain"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="relative overflow-hidden !p-5 min-h-[132px]">
              <Badge>이번주 기록 없음</Badge>
              <p className="mt-3 max-w-[190px] text-[15px] font-extrabold leading-snug text-ink">
                아직 루틴을 시작하지
                <br />
                않았어요
              </p>
              <div className="pointer-events-none absolute bottom-2 right-2">
                <Illustration
                  src={ILLUSTRATIONS.recommendEmpty}
                  alt=""
                  width={92}
                  height={92}
                />
              </div>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
