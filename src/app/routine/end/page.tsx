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
import { CHANGE_TAGS, DIFFICULTIES, END_REASONS } from "@/lib/constants";
import { ILLUSTRATIONS, difficultyIllustration } from "@/lib/illustrations";
import { setPendingEnd, showToast } from "@/lib/store";
import type { Difficulty, EndReason } from "@/lib/types";
import { useAppDerivations, useHydrated } from "@/lib/useAppState";

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
  const previewTags = CHANGE_TAGS.filter(
    (t) => !["#큰 변화 없음", "#아직 잘 모르겠음", "#좀 더 지켜봐야 함"].includes(t)
  ).slice(0, 6);

  if (!hydrated || !activeRoutine) {
    return (
      <AppShell showNav={false}>
        <div className="page-pad py-10 text-center text-ink-muted">불러오는 중...</div>
      </AppShell>
    );
  }

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

      <div className="page-pad mt-2 space-y-5 pb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <Illustration src={ILLUSTRATIONS.endHero} alt="" width={88} height={88} priority />
          <h2 className="text-xl font-extrabold leading-snug text-ink">
            이번 루틴,
            <br />
            어떠셨나요?
          </h2>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">종료 사유</h3>
            <Badge>필수</Badge>
          </div>
          <p className="mb-2 text-xs text-ink-muted">해당하는 이유를 선택해 주세요.</p>
          <div className="space-y-2">
            {END_REASONS.map((item) => (
              <RadioRow
                key={item}
                selected={reason === item}
                onClick={() => setReason(item)}
              >
                {item}
              </RadioRow>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">
              이번 루틴은 꾸준히 하기 어땠나요?
            </h3>
            <Badge>필수</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDifficulty(item)}
                className={`rounded-panel border p-3 text-center ${
                  difficulty === item
                    ? "border-accent bg-accent-faint/50"
                    : "border-line bg-surface-white"
                }`}
              >
                <Illustration
                  src={difficultyIllustration(item)}
                  alt={item}
                  width={48}
                  height={48}
                  className="mx-auto"
                />
                <p className="mt-2 text-xs font-bold text-ink">{item}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-ink">어떤 변화가 있었나요?</h3>
              <Badge>필수</Badge>
            </div>
            <button
              type="button"
              className="text-sm font-bold text-accent"
              onClick={() => {
                setPendingEnd({
                  reason: reason ?? undefined,
                  difficulty: difficulty ?? undefined,
                  tags,
                  feltChange,
                });
                router.push("/routine/end/tags");
              }}
            >
              전체 보기 ›
            </button>
          </div>
          <Card className="!p-3">
            {tags.length === 0 ? (
              <p className="text-sm text-ink-muted">변화 태그를 선택해주세요</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} tone="accent">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {previewTags.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <SelectChip
                    key={tag}
                    selected={selected}
                    className="text-xs"
                    onClick={() => {
                      if (selected) setTags((prev) => prev.filter((t) => t !== tag));
                      else if (tags.length >= 5)
                        showToast("태그는 최대 5개까지 선택할 수 있어요.");
                      else
                        setTags((prev) => [
                          ...prev.filter(
                            (t) =>
                              !["#큰 변화 없음", "#아직 잘 모르겠음", "#좀 더 지켜봐야 함"].includes(
                                t
                              )
                          ),
                          tag,
                        ]);
                    }}
                  >
                    {tag}
                  </SelectChip>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">체감 변화</h3>
            <Badge tone="muted">선택</Badge>
          </div>
          <p className="mb-2 text-xs text-ink-muted">
            이번 루틴을 통해 느낀 변화를 선택해 주세요.
          </p>
          <Card>
            <StarRating value={feltChange} onChange={setFeltChange} size="lg" />
            <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
              <span>전혀 없어요</span>
              <span>매우 많이 느껴요</span>
            </div>
          </Card>
        </div>

        <div>
          <Button
            fullWidth
            disabled={!canFinish || saving}
            onClick={() => {
              if (!reason || !difficulty) return;
              setSaving(true);
              setPendingEnd({ reason, difficulty, tags, feltChange });
              router.push("/skin-note/complete");
            }}
          >
            이번 루틴 마치기
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">
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
