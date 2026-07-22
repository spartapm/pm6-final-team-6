"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Illustration from "@/components/ui/Illustration";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import RadioRow from "@/components/ui/RadioRow";
import SelectChip from "@/components/ui/SelectChip";
import StarRating from "@/components/ui/StarRating";
import {
  DIFFICULTIES,
  END_REASONS,
  QUIT_DETAIL_REASONS,
  QUIT_END_REASON,
} from "@/lib/constants";
import { ILLUSTRATIONS, difficultyIllustration } from "@/lib/illustrations";
import { setPendingEnd } from "@/lib/store";
import type { Difficulty, EndReason } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

const REASON_EMOJI: Record<EndReason, string> = {
  "변화가 느껴져서 마칠래요": "✨",
  "변화는 없지만 기록을 마칠래요": "📝",
  "지속하기 어려워서 그만할래요": "😮‍💨",
};

export default function RoutineEndPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { state, activeRoutine } = useAppDerivations();
  const pending = state.pendingEnd;
  const [reason, setReason] = useState<EndReason | null>(pending?.reason ?? null);
  const [quitDetails, setQuitDetails] = useState<string[]>(pending?.quitDetails ?? []);
  const [quitSheetOpen, setQuitSheetOpen] = useState(false);
  const [draftQuitDetails, setDraftQuitDetails] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(
    pending?.difficulty ?? null
  );
  const [tags, setTags] = useState<string[]>(pending?.tags ?? []);
  const [feltChange, setFeltChange] = useState(pending?.feltChange ?? 0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.isLoggedIn) router.replace("/login?next=/routine/end");
    else if (!activeRoutine) router.replace("/care-log");
  }, [hydrated, state.isLoggedIn, activeRoutine, router]);

  useEffect(() => {
    if (pending?.tags) setTags(pending.tags);
    if (pending?.reason) setReason(pending.reason);
    if (pending?.quitDetails) setQuitDetails(pending.quitDetails);
    if (pending?.difficulty) setDifficulty(pending.difficulty);
    if (typeof pending?.feltChange === "number") setFeltChange(pending.feltChange);
  }, [
    pending?.tags,
    pending?.reason,
    pending?.quitDetails,
    pending?.difficulty,
    pending?.feltChange,
  ]);

  const dirty = Boolean(
    reason || difficulty || tags.length || feltChange > 0 || quitDetails.length
  );
  const quitReasonReady =
    reason !== QUIT_END_REASON || quitDetails.length > 0;
  const canFinish = Boolean(reason && difficulty && tags.length > 0 && quitReasonReady);

  const openQuitSheet = (initial: string[] = quitDetails) => {
    setDraftQuitDetails(initial);
    setQuitSheetOpen(true);
  };

  const closeQuitSheet = () => {
    setQuitSheetOpen(false);
    // 세부 사유 없이 닫으면 종료 사유 선택 해제
    if (quitDetails.length === 0) {
      setReason((prev) => (prev === QUIT_END_REASON ? null : prev));
    }
  };

  const toggleDraftQuitDetail = (item: string) => {
    setDraftQuitDetails((prev) => {
      if (prev.includes(item)) return prev.filter((v) => v !== item);
      if (prev.length >= 2) return prev;
      return [...prev, item];
    });
  };

  const selectReason = (item: EndReason) => {
    if (item === QUIT_END_REASON) {
      setReason(item);
      openQuitSheet(reason === QUIT_END_REASON ? quitDetails : []);
      return;
    }
    setReason(item);
    setQuitDetails([]);
  };

  if (!hydrated || !activeRoutine) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

  const goTags = () => {
    setPendingEnd({
      reason: reason ?? undefined,
      quitDetails: reason === QUIT_END_REASON ? quitDetails : undefined,
      difficulty: difficulty ?? undefined,
      tags,
      feltChange,
    });
    router.push("/routine/end/tags");
  };

  return (
    <AppShell showNav={false}>
      <PageHeader
        title="루틴 종료"
        center
        helpTourId="routine-end"
        onBack={() => {
          if (dirty) setConfirmOpen(true);
          else router.replace("/care-log");
        }}
      />

      <div className="page-pad mt-2 space-y-5 pb-10 animate-fade-up">
        <div className="flex items-center gap-3">
          <Illustration src={ILLUSTRATIONS.endHero} alt="" width={92} height={92} priority />
          <h2 className="text-[22px] font-extrabold leading-snug text-ink">
            이번 루틴,
            <br />
            어떠셨나요?
          </h2>
        </div>

        {/* End reason */}
        <section>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">종료 사유</h3>
            <Badge>필수</Badge>
          </div>
          <p className="mb-2.5 text-xs text-ink-muted">해당하는 이유를 선택해 주세요.</p>
          <Card
            data-help-id="end-reason"
            className="!divide-y !divide-dashed !divide-line/50 !p-2 !px-3"
          >
            {END_REASONS.map((item) => (
              <RadioRow
                key={item}
                selected={reason === item}
                onClick={() => selectReason(item)}
                left={<span className="text-base">{REASON_EMOJI[item]}</span>}
              >
                <span>{item}</span>
                {item === QUIT_END_REASON && quitDetails.length > 0 && (
                  <span className="mt-0.5 block text-[11px] font-semibold text-ink-muted">
                    {quitDetails.join(" · ")}
                  </span>
                )}
              </RadioRow>
            ))}
          </Card>
        </section>

        {/* Difficulty — 변화 과정 기록 feeling UI와 동일 */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">
              이번 루틴은 꾸준히 하기 어땠나요?
            </h3>
            <Badge>필수</Badge>
          </div>
          <div data-help-id="end-difficulty" className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((item) => {
              const selected = difficulty === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDifficulty(item)}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className={`flex h-[84px] w-[84px] items-center justify-center rounded-full transition ${
                      selected ? "bg-accent-faint ring-2 ring-accent" : "bg-transparent"
                    }`}
                  >
                    <Illustration
                      src={difficultyIllustration(item)}
                      alt={item}
                      width={68}
                      height={68}
                      className="h-[68px] w-[68px] object-contain"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold leading-tight ${
                      selected ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Change tags preview */}
        <section data-help-id="end-tags">
          <div className="mb-2.5 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">어떤 변화가 있었나요?</h3>
            <Badge>필수</Badge>
          </div>
          <button
            type="button"
            onClick={goTags}
            className="flex w-full items-center gap-2 rounded-card bg-white px-3 py-3 text-left shadow-card"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                tags.length > 0
                  ? "border-sky bg-sky text-white"
                  : "border-sky bg-surface-card text-transparent"
              }`}
            >
              ✓
            </span>
            <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
              {tags.length === 0 ? (
                <p className="text-sm text-ink-muted">변화 태그를 선택해주세요</p>
              ) : (
                <div className="flex w-max gap-1.5">
                  {tags.map((tag) => (
                    <SelectChip key={tag} selected className="pointer-events-none text-[11px]">
                      {tag}
                    </SelectChip>
                  ))}
                </div>
              )}
            </div>
            <span className="shrink-0 text-sky" aria-hidden>
              ›
            </span>
          </button>
        </section>

        {/* Felt change */}
        <section>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">체감 변화</h3>
            <Badge tone="soft">선택</Badge>
          </div>
          <p className="mb-2.5 text-xs text-ink-muted">
            이번 루틴을 통해 느낀 변화를 선택해 주세요.
          </p>
          <Card data-help-id="end-stars" className="!p-4">
            <StarRating value={feltChange} onChange={setFeltChange} size="lg" />
            <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
              <span>전혀 없어요</span>
              <span>매우 많이 느껴요</span>
            </div>
          </Card>
        </section>

        <div className="pt-1" data-help-id="end-finish">
          <Button
            fullWidth
            disabled={!canFinish || saving}
            onClick={() => {
              if (!reason || !difficulty) return;
              if (reason === QUIT_END_REASON && quitDetails.length === 0) {
                openQuitSheet();
                return;
              }
              setSaving(true);
              setPendingEnd({
                reason,
                quitDetails: reason === QUIT_END_REASON ? quitDetails : undefined,
                difficulty,
                tags,
                feltChange,
              });
              router.push("/skin-note/complete");
            }}
          >
            이번 루틴 마치기
          </Button>
          <p className="mt-2.5 text-center text-xs text-ink-muted">
            * 종료 사유 · 난이도 · 변화 태그 선택 시 활성화됩니다
          </p>
        </div>
      </div>

      {/* Quit detail reason sheet */}
      {quitSheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35">
          <div className="flex max-h-[88svh] w-full max-w-phone flex-col overflow-hidden rounded-t-[24px] bg-white shadow-card animate-fade-up">
            <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-extrabold leading-snug text-ink">
                  지속하기 어려웠던 이유가 무엇인가요?
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                  서비스 개선을 위해 가장 가까운 이유를 선택해주세요. (최대 2개까지)
                </p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted"
                onClick={closeQuitSheet}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
              <Card className="!divide-y !divide-dashed !divide-line/50 !p-2 !px-3">
                {QUIT_DETAIL_REASONS.map((item) => {
                  const selected = draftQuitDetails.includes(item);
                  const locked = !selected && draftQuitDetails.length >= 2;
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={locked}
                      onClick={() => toggleDraftQuitDetail(item)}
                      className={`flex w-full items-center gap-3 px-1 py-3 text-left transition ${
                        locked ? "cursor-not-allowed opacity-40" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1 text-sm font-bold text-ink">{item}</div>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                          selected
                            ? "border-sky bg-sky text-white"
                            : "border-sky bg-surface-card text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </Card>
            </div>

            <div className="border-t border-line/40 px-4 py-3">
              <Button
                fullWidth
                disabled={draftQuitDetails.length === 0}
                onClick={() => {
                  setQuitDetails(draftQuitDetails);
                  setReason(QUIT_END_REASON);
                  setQuitSheetOpen(false);
                }}
              >
                선택 완료
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen}
        title="작성 중인 내용이 저장되지 않았어요. 나가시겠어요?"
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => router.replace("/care-log")}
      />
    </AppShell>
  );
}
