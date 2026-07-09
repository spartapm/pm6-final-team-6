"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Character from "@/components/ui/Character";
import { daysSince, formatDateDot, todayKey, weekKey } from "@/lib/constants";
import { getMyActiveRoutines, saveDailyLog, selectRoutine } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function CareLogPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, profile, activeRoutine } = useAppDerivations();
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

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
    if (todayLog) {
      setChecked(todayLog.completedStepIds);
      setExpanded(true);
    } else {
      setChecked([]);
    }
  }, [todayLog, activeRoutine?.id]);

  const weeklyDone = useMemo(() => {
    if (!activeRoutine) return false;
    return state.weeklyChanges.some(
      (w) => w.routineId === activeRoutine.id && w.weekKey === weekKey()
    );
  }, [state.weeklyChanges, activeRoutine]);

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
          <Character mood="neutral" size={88} className="mx-auto" />
          <h1 className="text-xl font-extrabold text-ink">진행 중인 루틴이 없어요</h1>
          <p className="text-sm text-ink-muted">루틴을 등록하고 오늘의 케어를 시작해보세요</p>
          <Button
            fullWidth
            onClick={() => router.push(profile ? "/routine/register" : "/skin-profile")}
          >
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
      <div className="page-pad space-y-4 pt-5 pb-6 animate-fade-up">
        <Card className="overflow-hidden text-center">
          <div className="mx-auto mb-3 flex h-36 w-full items-center justify-center rounded-panel border border-dashed border-line bg-accent-faint/50">
            <Character mood={allDone ? "celebrate" : "smile"} size={100} />
          </div>
          <Badge tone="outline">
            {profile.skinType} 구역{expanded ? " 1등" : ""}
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold text-ink">입주</h1>
          <p className="mt-1 text-sm font-bold text-ink-soft">새 주민이 입주했어요</p>
          <p className="mt-1 text-xs text-ink-muted">이제 이 피부 구역을 함께 기록해봐요.</p>
        </Card>

        <Button
          fullWidth
          disabled={!canSave}
          variant={todayLog ? "secondary" : "outline"}
          onClick={async () => {
            if (!canSave) return;
            await saveDailyLog(activeRoutine.id, checked);
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
            ✓
          </span>
          {todayLog ? "오늘 기록 완료" : "오늘 했어요"}
        </Button>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-accent">✓</span>
              <h2 className="font-extrabold text-ink">케어로그</h2>
              <span className="text-accent">✦</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (myRoutines.length > 1) setPickerOpen(true);
                else setExpanded((v) => !v);
              }}
              className="rounded-chip border border-line px-3 py-1.5 text-xs font-bold text-accent"
            >
              {myRoutines.length > 1
                ? "루틴 선택하기"
                : expanded
                  ? "접기"
                  : "오늘 루틴 보기"}{" "}
              ▾
            </button>
          </div>

          {expanded ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 rounded-panel bg-surface p-3 text-center text-xs">
                <div>
                  <p className="text-ink-muted">오늘 루틴</p>
                  <p className="mt-1 font-extrabold text-ink">{total}단계</p>
                </div>
                <div>
                  <p className="text-ink-muted">완료</p>
                  <p className="mt-1 font-extrabold text-accent">{doneCount}개</p>
                </div>
                <div>
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-panel border border-dashed border-line bg-surface text-[10px] font-bold text-accent">
                      {step.category.slice(0, 2)}
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
              {myRoutines.length > 1 && (
                <button
                  type="button"
                  className="w-full text-center text-xs font-bold text-accent"
                  onClick={() => setExpanded(false)}
                >
                  접기
                </button>
              )}
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-ink-muted">
              루틴 단계를 보려면 &apos;오늘 루틴 보기&apos;를 선택하세요.
            </p>
          )}
        </Card>

        <Card className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
          <div>
            <p className="text-[11px] text-ink-muted">루틴 시작일</p>
            <p className="mt-1 text-sm font-bold text-ink">
              {formatDateDot(activeRoutine.startedAt)}
            </p>
          </div>
          <div className="h-10 border-l border-dashed border-line" />
          <div>
            <p className="text-[11px] text-ink-muted">시작한 지</p>
            <p className="mt-1 text-sm font-bold text-ink">
              {daysSince(activeRoutine.startedAt)}일
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/routine/end")}
            className="rounded-[10px] border border-line px-2.5 py-2 text-[11px] font-bold text-accent"
          >
            ⚑ 루틴 종료하기
          </button>
        </Card>

        <button
          type="button"
          onClick={() => router.push("/care-log/change")}
          className="flex w-full items-center gap-3 rounded-card border border-line bg-surface-white p-4 text-left shadow-card"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-panel border border-dashed border-line bg-accent-faint text-accent">
            ▣
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-ink">이번주 변화과정기록</p>
            <p className="mt-1 text-xs text-ink-muted">
              {weeklyDone
                ? "이번 주 변화 기록을 완료했어요."
                : "이번 주 피부 변화를 사진으로 남겨보세요."}
            </p>
          </div>
          <span className="text-accent">›</span>
        </button>

        <p className="text-center text-xs text-ink-muted">매일의 기록이 피부 변화를 만들어요!</p>
      </div>

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
                    setExpanded(true);
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
