"use client";

import Link from "next/link";
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
  const blurHonor = !loggedIn || !hasRoutine;

  const honorCards = [
    {
      key: "save",
      label: "저장 best",
      note: honor.bySave,
      emptyTitle: "저장 카드 없음",
      emptySub: "기록 후 공개",
    },
    {
      key: "comment",
      label: "댓글 best",
      note: honor.byComment,
      emptyTitle: "댓글 카드 없음",
      emptySub: "기록 후 공개",
    },
    {
      key: "help",
      label: "좋아요 best",
      note: honor.byHelp,
      emptyTitle: "좋아요 카드 없음",
      emptySub: "기록 후 공개",
    },
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

  return (
    <AppShell>
      <div className="page-pad space-y-5 pt-6 animate-fade-up">
        <section className="flex items-start justify-between gap-3">
          <div className="pt-2">
            <p className="text-[22px] font-extrabold leading-snug text-ink">
              안녕하세요
              <br />
              오늘도 <span className="text-accent">피부 기록</span>
              <br />
              해볼까요?
            </p>
          </div>
          <Illustration
            src={ILLUSTRATIONS.homeHero}
            alt="ANA 캐릭터"
            width={120}
            height={105}
            className="shrink-0 animate-soft-pop"
            priority
          />
        </section>

        <Card className="relative overflow-hidden">
          {!loggedIn && (
            <div className="pointer-events-none absolute inset-0 z-[1] bg-surface-white/40 backdrop-blur-[2px]" />
          )}
          <h2 className="text-base font-extrabold text-ink">내 피부 프로필</h2>
          {loggedIn ? (
            <>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ink-soft">피부 타입:</span>
                  {hasProfile ? (
                    <Badge>{profile!.skinType}</Badge>
                  ) : (
                    <Badge tone="muted">미등록</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ink-soft">주요 고민:</span>
                  {hasProfile ? (
                    profile!.concerns.map((c) => <Badge key={c}>{c}</Badge>)
                  ) : (
                    <Badge tone="muted">미등록</Badge>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleRoutineCta}
                  className="justify-between px-4"
                >
                  <span>
                    {hasRoutine
                      ? "오늘 루틴 기록하기"
                      : hasProfile
                        ? "오늘 루틴 등록하기"
                        : "오늘 루틴 기록하기"}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
                    →
                  </span>
                </Button>
                <p className="mt-2 text-center text-xs text-ink-muted">
                  {hasProfile
                    ? "내 피부 상태와 루틴을 기록하고 변화를 확인해보세요!"
                    : "아직 피부 정보가 없어요. 정보를 입력하면 맞춤 루틴을 추천받을 수 있어요"}
                </p>
              </div>
            </>
          ) : (
            <div className="relative z-[2] mt-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push("/login?next=/")}
                className="justify-between px-4"
              >
                <span>루틴 등록하러 로그인</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
                  →
                </span>
              </Button>
              <p className="mt-2 text-center text-xs text-ink-muted">
                로그인하고 내 피부 프로필과 루틴을 시작해보세요
              </p>
            </div>
          )}
        </Card>

        <section>
          <SectionHeader title="명예의 스킨노트" actionLabel="더보기 >" actionHref="/drawer" />
          <div className="grid grid-cols-3 gap-2">
            {honorCards.map((card) => {
              const note = card.note;
              if (!note) {
                return (
                  <div
                    key={card.key}
                    className="pointer-events-none rounded-panel border border-dashed border-line bg-accent-faint/40 p-3 text-center"
                  >
                    <p className="text-[11px] font-bold text-accent">{card.label}</p>
                    <div className="mx-auto my-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-dashed border-line bg-accent-faint/40">
                      <Illustration src={ILLUSTRATIONS.avatar1} alt="" width={44} height={44} />
                    </div>
                    <p className="text-xs font-bold text-accent">{card.emptyTitle}</p>
                    <p className="mt-1 text-[10px] text-accent/80">{card.emptySub}</p>
                  </div>
                );
              }
              return (
                <Link
                  key={card.key}
                  href={loggedIn ? `/notes/${note.id}` : `/login?next=/notes/${note.id}`}
                  className={`rounded-panel border border-line bg-surface-white p-3 text-center transition hover:bg-accent-faint/40 ${
                    blurHonor ? "blur-[2.5px]" : ""
                  }`}
                >
                  <p className="text-[11px] font-bold text-ink-soft">{card.label}</p>
                  <div className="mx-auto my-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-faint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={note.authorAvatar || defaultAvatar(note.authorId)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-xs font-bold text-ink">{note.authorNickname}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="이번주 참여 기록" />
          {hasRoutine ? (
            <Card>
              <div className="flex justify-between gap-1">
                {weekDays.map((day, i) => {
                  const key = todayKey(day);
                  const logged = state.dailyLogs.some(
                    (l) => l.date === key && l.routineId === activeRoutine!.id
                  );
                  const isToday = key === today;
                  const isFuture = day.getTime() > new Date(today).getTime();
                  const icon = weekDayIllustration({ isToday, logged, isFuture });
                  return (
                    <div key={key} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[11px] font-bold text-ink-muted">
                        {WEEKDAY_LABELS[i]}
                      </span>
                      <div
                        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full ${
                          isToday
                            ? "border-2 border-accent animate-pulse-ring"
                            : icon
                              ? "bg-accent-faint/30"
                              : "border border-dashed border-line"
                        }`}
                      >
                        {icon ? (
                          <Illustration src={icon} alt="" width={40} height={40} />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="relative overflow-hidden">
              <Badge tone="soft">이번주 기록 없음</Badge>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-ink">아직 루틴을 시작하지 않았어요</p>
                  <p className="mt-1 text-xs text-ink-muted">내일 이야기 해보기</p>
                </div>
                <Illustration
                  src={ILLUSTRATIONS.weekMissedPast}
                  alt=""
                  width={64}
                  height={64}
                />
              </div>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
