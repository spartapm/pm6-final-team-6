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
import { trackEvent } from "@/lib/analytics";
import { DIFFICULTIES, END_REASONS, daysSince } from "@/lib/constants";
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
    if (pending?.difficulty) setDifficulty(pending.difficulty);
    if (typeof pending?.feltChange === "number") setFeltChange(pending.feltChange);
  }, [pending?.tags, pending?.reason, pending?.difficulty, pending?.feltChange]);

  const dirty = Boolean(reason || difficulty || tags.length || feltChange > 0);
  const canFinish = Boolean(reason && difficulty && tags.length > 0);

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
          <Card className="!divide-y !divide-dashed !divide-line/50 !p-2 !px-3">
            {END_REASONS.map((item) => (
              <RadioRow
                key={item}
                selected={reason === item}
                onClick={() => setReason(item)}
                left={<span className="text-base">{REASON_EMOJI[item]}</span>}
              >
                {item}
              </RadioRow>
            ))}
          </Card>
        </section>

        {/* Difficulty */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">
              이번 루틴은 꾸준히 하기 어땠나요?
            </h3>
            <Badge>필수</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {DIFFICULTIES.map((item) => {
              const selected = difficulty === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDifficulty(item)}
                  className={`rounded-[16px] border p-3 text-center transition ${
                    selected
                      ? "border-sky bg-sky-faint shadow-card"
                      : "border-line bg-surface-card"
                  }`}
                >
                  <Illustration
                    src={difficultyIllustration(item)}
                    alt={item}
                    width={52}
                    height={52}
                    className="mx-auto"
                  />
                  <p className="mt-2 text-[12px] font-extrabold text-ink">{item}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Change tags preview */}
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">어떤 변화가 있었나요?</h3>
            <Badge>필수</Badge>
          </div>
          <button
            type="button"
            onClick={goTags}
            className="flex w-full items-center gap-2 rounded-card bg-white shadow-card px-3 py-3 text-left shadow-card"
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
          <Card className="!p-4">
            <StarRating value={feltChange} onChange={setFeltChange} size="lg" />
            <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
              <span>전혀 없어요</span>
              <span>매우 많이 느껴요</span>
            </div>
          </Card>
        </section>

        <div className="pt-1">
          <Button
            fullWidth
            disabled={!canFinish || saving}
            onClick={() => {
              if (!reason || !difficulty) return;
              setSaving(true);
              setPendingEnd({ reason, difficulty, tags, feltChange });
              trackEvent("routine_end", {
                end_reason: reason,
                difficulty,
                star_rating: feltChange,
                duration_days: daysSince(activeRoutine.startedAt),
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
