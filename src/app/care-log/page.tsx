"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import { trackEvent, trackScreenView } from "@/lib/analytics";
import { daysSince, formatDateDot, todayKey, weekKey } from "@/lib/constants";
import { ILLUSTRATIONS, careIllustration } from "@/lib/illustrations";
import { getMyActiveRoutines, saveDailyLog, selectRoutine } from "@/lib/store";
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
    trackScreenView("carelog_main", {
      has_active_routine: Boolean(activeRoutine),
    });
  }, [hydrated, state.isLoggedIn, activeRoutine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return (
      <AppShell>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  if (!activeRoutine || !profile) {
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
          <h1 className="text-xl font-extrabold text-ink">진행 중인 루틴이 없어요</h1>
          <p className="text-sm text-ink-muted">루틴을 등록하고 오늘의 케어를 시작해보세요</p>
          <Button fullWidth onClick={() => router.push("/skin-profile")}>
            루틴 등록하기
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

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col">
        <div className="page-pad flex items-center justify-between gap-2 pt-4">
          <h1 className="text-lg font-extrabold text-ink">케어로그</h1>
          <button
            type="button"
            onClick={() => setEndConfirmOpen(true)}
            className="rounded-chip border border-accent bg-surface-white px-3 py-1.5 text-xs font-bold text-accent"
          >
            루틴 종료
          </button>
        </div>

        <div className="page-pad min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 pt-3 animate-fade-up">
          <Card className="overflow-hidden !p-0 text-center">
            <div className="flex w-full items-center justify-center bg-accent-faint/30 px-2 pt-4">
              <Illustration
                src={careIllustration(profile.skinType, allDone)}
                alt={`${profile.skinType} 구역 캐릭터`}
                width={280}
                height={200}
                className="h-auto w-full max-w-[280px] object-contain"
                priority
              />
            </div>
            <div className="px-4 pb-4 pt-2">
              <Badge tone="outline">{profile.skinType} 구역</Badge>
              <h2 className="mt-3 text-2xl font-extrabold text-ink">입주</h2>
              <p className="mt-1 text-sm font-bold text-ink-soft">새 주민이 입주했어요</p>
              <p className="mt-1 text-xs text-ink-muted">이제 이 피부 구역을 함께 기록해봐요.</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-accent">✓</span>
                <h2 className="font-extrabold text-ink">케어로그</h2>
                <span className="text-accent">✦</span>
              </div>
              {myRoutines.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="rounded-chip border border-line px-3 py-1.5 text-xs font-bold text-accent"
                >
                  루틴 선택하기 ▾
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 rounded-panel bg-surface p-3 text-center text-xs">
                <div>
                  <p className="mb-1 text-base text-accent">☰</p>
                  <p className="text-ink-muted">오늘 루틴</p>
                  <p className="mt-1 font-extrabold text-ink">{total}단계</p>
                </div>
                <div>
                  <p className="mb-1 text-base text-accent">✓</p>
                  <p className="text-ink-muted">완료</p>
                  <p className="mt-1 font-extrabold text-accent">{doneCount}개</p>
                </div>
                <div>
                  <p className="mb-1 text-base text-accent">…</p>
                  <p className="text-ink-muted">남은 단계</p>
                  <p className="mt-1 font-extrabold text-ink">{remain}개</p>
                </div>
              </div>

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
                    className={`flex w-full items-center gap-3 rounded-panel border p-3 text-left ${
                      isChecked ? "border-accent bg-accent-faint/50" : "border-line"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${
                        isChecked ? "bg-accent text-white" : "bg-surface text-ink-muted"
                      }`}
                    >
                      {step.order}
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-panel border border-dashed border-line bg-surface text-[10px] font-bold text-accent">
                      {step.product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={step.product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        step.category.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-ink">{step.category}</p>
                      <p className="truncate text-xs text-ink-muted">{step.product.name}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`mb-1 block text-[10px] font-bold ${
                          isChecked ? "text-accent" : "text-ink-muted"
                        }`}
                      >
                        {isChecked ? "완료" : "미완료"}
                      </span>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
                          isChecked
                            ? "border-accent bg-accent text-white"
                            : "border-line text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {weeklyDone ? (
            <div className="flex w-full items-center gap-3 rounded-card border border-line bg-surface-white p-4 shadow-card">
              <Illustration
                src={ILLUSTRATIONS.changeCard}
                alt=""
                width={56}
                height={56}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-ink">이번 주 변화 과정 기록 완료!</p>
                <p className="mt-1 text-xs font-medium text-ink-soft">다음주에 기록할 수 있어요.</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackEvent("week_record_click", { is_completed: false });
                router.push("/care-log/change");
              }}
              className="flex w-full items-center gap-3 rounded-card border border-line bg-surface-white p-4 text-left shadow-card"
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
                <p className="mt-1 text-xs font-medium text-ink-soft">
                  이번 주 피부 변화를 사진으로 남겨보세요.
                </p>
              </div>
              <span className="text-accent">›</span>
            </button>
          )}

          <Card className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] text-ink-muted">루틴 시작일</p>
              <p className="mt-1 text-sm font-bold text-ink">
                {formatDateDot(activeRoutine.startedAt)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">시작한 지</p>
              <p className="mt-1 text-sm font-bold text-ink">
                {daysSince(activeRoutine.startedAt)}일
              </p>
            </div>
          </Card>

          <p className="pb-2 text-center text-xs font-medium text-ink-soft">
            매일의 기록이 피부 변화를 만들어요!
          </p>
        </div>

        <div className="page-pad shrink-0 border-t border-line/40 bg-surface-white py-3">
          <Button
            fullWidth
            disabled={!todayLog && !canSave}
            variant={todayLog ? "secondary" : canSave ? "primary" : "outline"}
            onClick={async () => {
              if (!canSave || todayLog) return;
              await saveDailyLog(activeRoutine.id, checked);
              const completionRate =
                total > 0 ? Math.round((doneCount / total) * 100) / 100 : 0;
              trackEvent("today_done", {
                checked_count: doneCount,
                total_steps: total,
                completion_rate: completionRate,
                day_since_start: daysSince(activeRoutine.startedAt),
                is_full_complete: doneCount === total,
              });
            }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
              ✓
            </span>
            {todayLog ? "오늘 기록 완료" : "오늘 했어요"}
          </Button>
        </div>
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
          <div className="w-full max-w-phone rounded-t-[24px] bg-surface-white p-4">
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
                  className={`w-full rounded-panel border px-3 py-3 text-left ${
                    routine.id === activeRoutine.id
                      ? "border-accent bg-accent-faint"
                      : "border-line"
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
