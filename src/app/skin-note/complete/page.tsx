"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Illustration from "@/components/ui/Illustration";
import PageHeader from "@/components/ui/PageHeader";
import StarRating from "@/components/ui/StarRating";
import { BRAND, CHANGE_FEELINGS, daysSince, formatDateDot } from "@/lib/constants";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { finishRoutine, showToast } from "@/lib/store";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

export default function SkinNoteCompletePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, user, profile, activeRoutine } = useAppDerivations();
  const pending = state.pendingEnd;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/skin-note/complete");
    else if (!activeRoutine || !pending?.reason || !pending.difficulty || !pending.tags.length) {
      router.replace("/care-log");
    }
  }, [hydrated, state.isLoggedIn, activeRoutine, pending, router]);

  const weekly = useMemo(
    () =>
      activeRoutine
        ? state.weeklyChanges.filter((w) => w.routineId === activeRoutine.id)
        : [],
    [state.weeklyChanges, activeRoutine]
  );

  if (!hydrated || !user || !profile || !activeRoutine || !pending) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const duration = daysSince(activeRoutine.startedAt);
  const createdLabel = formatDateDot(new Date().toISOString());
  const endDate = formatDateDot(new Date().toISOString());
  const startDate = formatDateDot(activeRoutine.startedAt);
  const weeks = Math.max(1, Math.ceil(duration / 7));

  const complete = async (visibility: "private" | "public") => {
    setSaving(true);
    const note = await finishRoutine({
      reason: pending.reason!,
      difficulty: pending.difficulty!,
      tags: pending.tags,
      feltChange: pending.feltChange,
      visibility,
    });
    if (!note) {
      showToast("루틴 종료에 실패했어요. 다시 시도해주세요.");
      setSaving(false);
      return;
    }
    if (visibility === "private") router.push("/mypage");
    else router.push("/drawer");
  };

  return (
    <AppShell showNav={false}>
      <PageHeader title="" backHref="/routine/end" />

      <div className="page-pad -mt-2 space-y-4 pb-8 animate-fade-up">
        <div className="text-center">
          <Illustration
            src={ILLUSTRATIONS.tagsHero2}
            alt=""
            width={120}
            height={100}
            className="mx-auto"
            priority
          />
          <h1 className="mt-3 text-xl font-extrabold text-ink">스킨노트가 완성되었어요!</h1>
          <p className="mt-1 text-sm text-ink-muted">나의 피부 여정을 기록해 보세요 ✦</p>
        </div>

        <div className="rounded-card border-2 border-accent bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-chip border border-line bg-surface-white px-3 py-1.5 text-xs font-bold text-accent"
              onClick={() => showToast("경험카드 이미지 저장은 MVP에서 미리보기로 제공돼요.")}
            >
              스킨노트 저장하기
            </button>
            <span className="text-[11px] text-ink-muted">{createdLabel} 생성</span>
          </div>

          <div className="space-y-3 border-b border-dashed border-line pb-3 text-sm">
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">피부 타입</span>
              <span className="font-bold text-ink">{profile.skinType}</span>
            </div>
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">피부 고민</span>
              <span className="font-bold text-ink">{profile.concerns.join(" · ")}</span>
            </div>
          </div>

          <div className="space-y-3 border-b border-dashed border-line py-3 text-sm">
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">사용 제품</span>
              <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
                {activeRoutine.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-line bg-accent-faint text-[9px] font-bold text-accent"
                  >
                    {step.category.slice(0, 2)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">사용 기간</span>
              <span className="font-bold text-ink">
                {weeks}주 ({startDate} ~ {endDate})
              </span>
            </div>
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">루틴 순서</span>
              <span className="font-bold text-ink">
                {activeRoutine.steps.map((s) => s.category).join(" > ")}
              </span>
            </div>
          </div>

          <div className="border-b border-dashed border-line py-3 text-sm">
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">루틴 난이도</span>
              <span className="font-bold text-ink">{pending.difficulty}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-line py-3">
            <p className="mb-2 text-sm font-bold text-ink">변화 과정</p>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(weekly.length > 0
                ? weekly
                : [{ id: "empty", feeling: "변화가 있었어요" as const }]
              ).map((w, index) => {
                const feeling = CHANGE_FEELINGS.find((f) => f.value === w.feeling);
                const label =
                  index === 0 ? "시작 전" : `${index}주차`;
                return (
                  <div key={w.id} className="flex items-center gap-1">
                    <div className="w-16 text-center">
                      {"photoUrl" in w && w.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.photoUrl}
                          alt=""
                          className="mx-auto h-14 w-14 rounded-[10px] object-cover"
                        />
                      ) : (
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] border border-dashed border-line bg-accent-faint text-xl">
                          {feeling?.emoji ?? "🙂"}
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-ink-muted">{label}</p>
                    </div>
                    {index < Math.max(weekly.length, 1) - 1 && (
                      <span className="text-accent">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-3 text-sm">
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">변화 태그</span>
              <div className="flex flex-wrap gap-1.5">
                {pending.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-ink-muted">체감 변화</span>
              <StarRating value={pending.feltChange} readOnly size="sm" />
            </div>
            <div className="flex gap-3">
              <span className="w-16 shrink-0 text-ink-muted">종료 사유</span>
              <span className="font-bold text-ink">{pending.reason}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-ink-muted">
            ✦ {BRAND} · A Note Archive ✦
          </p>
        </div>

        <Button
          fullWidth
          variant="outline"
          disabled={saving}
          onClick={() => complete("private")}
        >
          나만 보기
        </Button>
        <Button fullWidth disabled={saving} onClick={() => complete("public")}>
          공유하고 스킨서랍장 구경하기
        </Button>
      </div>
    </AppShell>
  );
}
