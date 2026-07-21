"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import { trackEvent, trackScreenView } from "@/lib/analytics";
import { daysSince, formatDateDot, todayKey, weekKey } from "@/lib/constants";
import { ILLUSTRATIONS, careIllustration } from "@/lib/illustrations";
import { getMyActiveRoutines, saveDailyLog, selectRoutine, showToast } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function CareLogPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, profile, activeRoutine } = useAppDerivations();
  const [checked, setChecked] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/care-log");
  }, [hydrated, state.isLoggedIn, router]);

  const myRoutines = useMemo(() => getMyActiveRoutines(state), [state]);
  const today = todayKey();
  const todayLog = useMemo(
    () =>
      activeRoutine
        ? state.dailyLogs.find((l) => l.routineId === activeRoutine.id && l.date === today)
        : null,
    [state.dailyLogs, activeRoutine, today]
  );

  useEffect(() => {
    if (todayLog) setChecked(todayLog.completedStepIds);
    else setChecked([]);
  }, [todayLog, activeRoutine?.id]);

  const weeklyDone = useMemo(() => {
    if (!activeRoutine) return false;
    return state.weeklyChanges.some(
      (w) => w.routineId === activeRoutine.id && w.weekKey === weekKey()
    );
  }, [state.weeklyChanges, activeRoutine]);

  useEffect(() => {
    if (!hydrated || !state.isLoggedIn) return;
    trackScreenView(
      "carelog_main",
      { has_active_routine: Boolean(activeRoutine) },
      "carelog_main"
    );
  }, [hydrated, state.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  if (!activeRoutine) {
    return (
      <AppShell>
        <div className="page-pad space-y-4 pt-10 text-center animate-fade-up">
          <Illustration
            src={careIllustration(profile?.skinType, false)}
            alt=""
            width={140}
            height={120}
            className="mx-auto"
          />
          {profile ? (
            <>
              <h1 className="text-xl font-extrabold text-ink">내 피부 프로필을 확인해 주세요</h1>
              <p className="text-sm leading-relaxed text-ink-muted">
                루틴을 시작하기 전,
                <br />
                피부 타입과 고민 정보를 수정할 수 있어요.
              </p>
              <Button fullWidth onClick={() => router.push("/skin-profile")}>
                피부 프로필 수정하기
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold text-ink">진행 중인 루틴이 없어요</h1>
              <p className="text-sm text-ink-muted">루틴을 등록하고 오늘의 케어를 시작해보세요</p>
              <Button fullWidth onClick={() => router.push("/skin-profile")}>
                루틴 등록하기
              </Button>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="page-pad space-y-4 pt-10 text-center animate-fade-up">
          <Illustration
            src={careIllustration(null, false)}
            alt=""
            width={140}
            height={120}
            className="mx-auto"
          />
          <h1 className="text-xl font-extrabold text-ink">내 피부 프로필을 확인해 주세요</h1>
          <p className="text-sm leading-relaxed text-ink-muted">
            루틴을 시작하기 전,
            <br />
            피부 타입과 고민 정보를 수정할 수 있어요.
          </p>
          <Button fullWidth onClick={() => router.push("/skin-profile")}>
            피부 프로필 수정하기
          </Button>
        </div>
      </AppShell>
    );
  }

  const total = activeRoutine.steps.length;
  const doneCount = checked.length;
  const remain = Math.max(0, total - doneCount);
  const canSave = !todayLog && doneCount >= 2;
  const allDone = Boolean(todayLog && doneCount === total);

  const handleTodayDone = async () => {
    if (todayLog) {
      showToast("오늘은 이미 기록했어요.");
      return;
    }
    if (!canSave) {
      showToast("최소 2단계 이상 체크한 뒤 저장할 수 있어요.");
      return;
    }
    try {
      await saveDailyLog(activeRoutine.id, checked);
      const completionRate = total > 0 ? Math.round((doneCount / total) * 100) / 100 : 0;
      trackEvent("today_done", {
        checked_count: doneCount,
        total_steps: total,
        completion_rate: completionRate,
        day_since_start: daysSince(activeRoutine.startedAt),
        is_full_complete: doneCount === total,
      });
    } catch {
      showToast("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <AppShell>
      <div className="page-pad space-y-4 pb-28 pt-3 animate-fade-up">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setEndConfirmOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-soft shadow-card"
            aria-label="루틴 종료"
            title="루틴 종료"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3v9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7.5 5.5a7.5 7.5 0 1 0 9 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <section className="text-center">
          <div className="mx-auto flex w-full max-w-[300px] items-center justify-center">
            <Illustration
              src={careIllustration(profile.skinType, allDone)}
              alt={`${profile.skinType} 구역 캐릭터`}
              width={280}
              height={200}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <div className="mt-2 inline-flex rounded-chip bg-white px-3 py-1 shadow-card">
            <span className="text-[12px] font-bold text-ink">{profile.skinType} 구역</span>
          </div>
          <h1 className="mt-3 text-[28px] font-extrabold tracking-tight text-ink">입주</h1>
          <p className="mt-1 text-[15px] font-extrabold text-ink">새 주민이 입주했어요</p>
          <p className="mt-1 text-xs text-ink-muted">이제 이 피부 구역을 함께 기록해봐요.</p>
        </section>

        <Card className="!px-4 !py-3.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2 border-r border-dashed border-black/10 pr-3">
              <span className="mt-0.5 text-sky" aria-hidden>
                📅
              </span>
              <div>
                <p className="text-[11px] text-ink-muted">루틴 시작일</p>
                <p className="mt-0.5 text-sm font-extrabold text-ink">
                  {formatDateDot(activeRoutine.startedAt)}
                </p>
              </div>
            </div>
            <div className="pl-2">
              <p className="text-[11px] text-ink-muted">시작한 지</p>
              <p className="mt-0.5 text-sm font-extrabold text-ink">
                {daysSince(activeRoutine.startedAt)}일
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sky" aria-hidden>
                📋
              </span>
              <h2 className="text-[15px] font-extrabold text-ink">케어로그</h2>
              <span className="text-sky text-xs" aria-hidden>
                ✦
              </span>
            </div>
            {myRoutines.length > 1 && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-chip border border-sky bg-white px-3 py-1.5 text-xs font-bold text-sky"
              >
                루틴 선택 ▾
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 rounded-[14px] bg-[#F9FBFE] text-center text-[11px]">
            <div className="border-r border-dashed border-black/10 px-2 py-2.5">
              <p className="text-ink-muted">오늘 루틴</p>
              <p className="mt-1 font-extrabold text-ink">{total}단계</p>
            </div>
            <div className="border-r border-dashed border-black/10 px-2 py-2.5">
              <p className="text-ink-muted">완료</p>
              <p className="mt-1 font-extrabold text-sky">{doneCount}개</p>
            </div>
            <div className="px-2 py-2.5">
              <p className="text-ink-muted">남은 단계</p>
              <p className="mt-1 font-extrabold text-ink">{remain}개</p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {activeRoutine.steps.map((step) => {
              const isChecked = checked.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={Boolean(todayLog)}
                  onClick={() =>
                    setChecked((prev) =>
                      isChecked ? prev.filter((id) => id !== step.id) : [...prev, step.id]
                    )
                  }
                  className="flex w-full items-center gap-2.5 rounded-[14px] bg-[#F9FBFE] p-3 text-left disabled:opacity-90"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-extrabold text-ink shadow-sm">
                    {step.order}
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-empty text-[10px] font-bold text-ink-muted">
                    {step.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={step.product.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "이미지"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-ink-muted">{step.category}</p>
                    <p className="truncate text-[13px] font-extrabold text-ink">
                      {step.product.name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border text-xs ${
                      isChecked
                        ? "border-sky bg-sky text-white"
                        : "border-sky bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {weeklyDone ? (
          <div className="flex w-full items-center gap-3 rounded-card bg-white p-4 shadow-card">
            <Illustration
              src={ILLUSTRATIONS.changeCard}
              alt=""
              width={56}
              height={56}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-ink">이번 주 변화 과정 기록 완료!</p>
              <p className="mt-1 text-xs text-ink-muted">다음주에 기록할 수 있어요.</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              trackEvent("week_record_click", { is_completed: false });
              router.push("/care-log/change");
            }}
            className="flex w-full items-center gap-3 rounded-card bg-white p-4 text-left shadow-card"
          >
            <Illustration
              src={ILLUSTRATIONS.changeCard}
              alt=""
              width={56}
              height={56}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-ink">이번 주 변화 과정 기록</p>
              <p className="mt-1 text-xs text-ink-muted">
                이번 주 피부 변화를 사진으로 남겨보세요.
              </p>
            </div>
            <span className="text-sky">›</span>
          </button>
        )}
      </div>

      {/* Fixed above bottom nav; only the button itself receives clicks */}
      <div
        className="pointer-events-none fixed inset-x-0 z-50 mx-auto w-full max-w-phone px-4"
        style={{ bottom: "calc(var(--nav-height) + var(--safe-bottom) + 12px)" }}
      >
        <Button
          type="button"
          fullWidth
          variant="primary"
          className={[
            "pointer-events-auto",
            todayLog || !canSave
              ? "!bg-btn-disabled !text-ink-muted !border-transparent shadow-none"
              : "shadow-float",
          ].join(" ")}
          aria-disabled={Boolean(todayLog) || !canSave}
          onClick={handleTodayDone}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current/25 bg-white/60 text-xs">
            ✓
          </span>
          {todayLog ? "오늘 기록 완료" : "오늘 했어요"}
        </Button>
      </div>

      <Modal
        open={endConfirmOpen}
        title="이 루틴을 종료할까요?"
        confirmLabel="예"
        cancelLabel="아니요"
        onCancel={() => setEndConfirmOpen(false)}
        onConfirm={() => {
          setEndConfirmOpen(false);
          router.push("/routine/end");
        }}
      />

      {pickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="w-full max-w-phone rounded-t-[24px] bg-white p-4 shadow-float">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-ink">루틴 선택하기</h3>
              <button type="button" onClick={() => setPickerOpen(false)}>
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {myRoutines.map((routine) => (
                <button
                  key={routine.id}
                  type="button"
                  className={`w-full rounded-[14px] px-3 py-3 text-left ${
                    routine.id === activeRoutine.id
                      ? "border border-sky bg-sky-faint"
                      : "bg-[#F9FBFE]"
                  }`}
                  onClick={async () => {
                    await selectRoutine(routine.id);
                    setPickerOpen(false);
                  }}
                >
                  <p className="font-extrabold text-ink">{routine.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {routine.steps.map((s) => s.category).join(" · ")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
